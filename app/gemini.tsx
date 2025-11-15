import { Link } from "expo-router";
import * as Speech from "expo-speech";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// ✅ 公式ドキュメント準拠のモデル＆エンドポイント
// https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export default function GeminiScreen() {
  const [prompt, setPrompt] = useState("AIについて簡単に説明してください");
  const [apiKey, setApiKey] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // 音声合成の状態を監視
  useEffect(() => {
    const checkSpeaking = async () => {
      const speaking = await Speech.isSpeakingAsync();
      setIsSpeaking(speaking);
    };

    const interval = setInterval(checkSpeaking, 500);
    return () => clearInterval(interval);
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      Alert.alert("エラー", "プロンプトを入力してください");
      return;
    }

    if (!apiKey.trim()) {
      Alert.alert("エラー", "Gemini APIキーを入力してください");
      return;
    }

    setIsGenerating(true);
    setGeneratedText("");

    try {
      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // ✅ 公式と同じくヘッダでAPIキーを渡す
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              // role は省略可能（公式REST例も parts のみ）
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `APIエラー: ${response.status}`
        );
      }

      const data = await response.json();
      const text =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "テキストを生成できませんでした";

      setGeneratedText(text);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "不明なエラーが発生しました";
      Alert.alert("エラー", errorMessage);
      console.error("Gemini API error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSpeak = () => {
    if (!generatedText.trim()) {
      Alert.alert("エラー", "読み上げるテキストがありません");
      return;
    }

    Speech.speak(generatedText, {
      language: "ja-JP",
      pitch: 1.0,
      rate: 1.0,
      onStart: () => {
        setIsSpeaking(true);
      },
      onDone: () => {
        setIsSpeaking(false);
      },
      onError: (error) => {
        Alert.alert("エラー", `音声合成エラー: ${error.message}`);
        setIsSpeaking(false);
      },
    });
  };

  const handleStop = async () => {
    await Speech.stop();
    setIsSpeaking(false);
  };

  const handleClear = () => {
    setGeneratedText("");
    Speech.stop();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* タイトルバー */}
        <View style={styles.header}>
          <Text style={styles.title}>Gemini + Speech</Text>
          <Text style={styles.subtitle}>
            Geminiでテキスト生成 → 音声読み上げ
          </Text>
          <View style={styles.navLinksContainer}>
            <Link href="/" asChild>
              <TouchableOpacity style={[styles.navLink, styles.navLinkThird]}>
                <Text style={styles.navLinkText}>← ホーム</Text>
              </TouchableOpacity>
            </Link>
            <Link href="/speech" asChild>
              <TouchableOpacity style={[styles.navLink, styles.navLinkThird]}>
                <Text style={styles.navLinkText}>📢 TTS</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        {/* APIキー入力 */}
        <View style={styles.section}>
          <Text style={styles.label}>Gemini APIキー</Text>
          <Text style={styles.hint}>
            APIキーは
            <Text
              style={styles.link}
              onPress={() =>
                Alert.alert(
                  "APIキーの取得",
                  "https://ai.google.dev/ でAPIキーを取得してください"
                )
              }
            >
              {" "}
              https://ai.google.dev/{" "}
            </Text>
            で取得できます
          </Text>
          <TextInput
            style={styles.apiKeyInput}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="APIキーを入力してください"
            placeholderTextColor="#999"
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        {/* プロンプト入力 */}
        <View style={styles.section}>
          <Text style={styles.label}>プロンプト</Text>
          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={3}
            value={prompt}
            onChangeText={setPrompt}
            placeholder="AIに聞きたいことを入力してください"
            placeholderTextColor="#999"
          />
        </View>

        {/* 生成ボタン */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.generateButton,
              isGenerating && styles.generateButtonDisabled,
            ]}
            onPress={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.generateButtonText}>生成中...</Text>
              </View>
            ) : (
              <Text style={styles.generateButtonText}>✨ テキスト生成</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 生成されたテキスト */}
        {generatedText ? (
          <View style={styles.section}>
            <View style={styles.resultHeader}>
              <Text style={styles.label}>生成されたテキスト</Text>
              <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>クリア</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.resultBox}>
              <Text style={styles.resultText}>{generatedText}</Text>
            </View>

            {/* 読み上げコントロール */}
            <View style={styles.speechControls}>
              <TouchableOpacity
                style={[
                  styles.speakButton,
                  isSpeaking && styles.speakButtonActive,
                ]}
                onPress={handleSpeak}
                disabled={isSpeaking}
              >
                <Text style={styles.speakButtonText}>
                  {isSpeaking ? "🔊 読み上げ中..." : "🔊 読み上げ"}
                </Text>
              </TouchableOpacity>
              {isSpeaking && (
                <TouchableOpacity
                  style={styles.stopButton}
                  onPress={handleStop}
                >
                  <Text style={styles.stopButtonText}>停止</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.placeholderBox}>
              <Text style={styles.placeholderText}>
                生成されたテキストがここに表示されます
              </Text>
            </View>
          </View>
        )}

        {/* 使い方 */}
        <View style={styles.section}>
          <Text style={styles.label}>使い方</Text>
          <View style={styles.instructionsBox}>
            <Text style={styles.instructionText}>
              1. Gemini APIキーを入力{"\n"}
              2. プロンプトを入力{"\n"}
              3. 「テキスト生成」ボタンをタップ{"\n"}
              4. 生成されたテキストを確認{"\n"}
              5. 「読み上げ」ボタンで音声再生
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ↓ スタイルはそのまま（変更なし）
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    paddingTop: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  navLinksContainer: {
    marginTop: 8,
    flexDirection: "row",
    gap: 8,
  },
  navLink: {
    padding: 12,
    backgroundColor: "#34C759",
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
  },
  navLinkThird: {
    flex: 1,
  },
  navLinkText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    backgroundColor: "#fff",
    padding: 16,
    marginTop: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
    lineHeight: 18,
  },
  link: {
    color: "#007AFF",
    textDecorationLine: "underline",
  },
  apiKeyInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fafafa",
    fontFamily: "monospace",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: "top",
    backgroundColor: "#fafafa",
  },
  generateButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  generateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  clearButton: {
    padding: 6,
    paddingHorizontal: 12,
    backgroundColor: "#ff3b30",
    borderRadius: 6,
  },
  clearButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  resultBox: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 16,
    backgroundColor: "#fafafa",
    minHeight: 100,
    marginBottom: 12,
  },
  resultText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  placeholderBox: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 32,
    backgroundColor: "#fafafa",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
  },
  placeholderText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  speechControls: {
    flexDirection: "row",
    gap: 12,
  },
  speakButton: {
    flex: 1,
    backgroundColor: "#34C759",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  speakButtonActive: {
    backgroundColor: "#28a745",
    opacity: 0.8,
  },
  speakButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  stopButton: {
    flex: 1,
    backgroundColor: "#ff3b30",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  stopButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  instructionsBox: {
    backgroundColor: "#E3F2FD",
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#1976D2",
  },
});
