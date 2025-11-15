import { Link } from "expo-router";
import * as Speech from "expo-speech";
import { useEffect, useState } from "react";
import {
    Alert,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type Voice = {
  identifier: string;
  name: string;
  language: string;
  quality?: string;
};

export default function SpeechScreen() {
  const [text, setText] = useState("こんにちは、これは音声合成のテストです。");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string | undefined>();
  const [language, setLanguage] = useState("ja-JP");
  const [pitch, setPitch] = useState(1.0);
  const [rate, setRate] = useState(1.0);

  // 利用可能な音声を取得
  useEffect(() => {
    (async () => {
      try {
        const voices = await Speech.getAvailableVoicesAsync();
        setAvailableVoices(voices);
        // 日本語の音声をデフォルトに設定
        const japaneseVoice = voices.find(
          (v) => v.language.startsWith("ja") || v.language === "ja-JP"
        );
        if (japaneseVoice) {
          setSelectedVoice(japaneseVoice.identifier);
        }
      } catch (error) {
        console.error("Error loading voices:", error);
      }
    })();
  }, []);

  // 音声合成の状態を監視
  useEffect(() => {
    const checkSpeaking = async () => {
      const speaking = await Speech.isSpeakingAsync();
      setIsSpeaking(speaking);
    };

    const interval = setInterval(checkSpeaking, 500);
    return () => clearInterval(interval);
  }, []);

  const handleSpeak = () => {
    if (!text.trim()) {
      Alert.alert("エラー", "テキストを入力してください");
      return;
    }

    Speech.speak(text, {
      language: language,
      pitch: pitch,
      rate: rate,
      voice: selectedVoice,
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

  const handlePause = async () => {
    if (Platform.OS === "ios") {
      await Speech.pause();
      setIsSpeaking(false);
    }
  };

  const handleResume = async () => {
    if (Platform.OS === "ios") {
      await Speech.resume();
      setIsSpeaking(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* タイトルバー */}
        <View style={styles.header}>
          <Text style={styles.title}>Text-to-Speech</Text>
          <Text style={styles.subtitle}>テキストを音声に変換</Text>
          <View style={styles.navLinksContainer}>
            <Link href="/" asChild>
              <TouchableOpacity style={[styles.navLink, styles.navLinkHalf]}>
                <Text style={styles.navLinkText}>← ホーム</Text>
              </TouchableOpacity>
            </Link>
            <Link href="/gemini" asChild>
              <TouchableOpacity style={[styles.navLink, styles.navLinkHalf]}>
                <Text style={styles.navLinkText}>🤖 Gemini</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        {/* テキスト入力 */}
        <View style={styles.section}>
          <Text style={styles.label}>テキスト</Text>
          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={4}
            value={text}
            onChangeText={setText}
            placeholder="音声に変換するテキストを入力してください"
            placeholderTextColor="#999"
          />
        </View>

        {/* 言語設定 */}
        <View style={styles.section}>
          <Text style={styles.label}>言語コード</Text>
          <TextInput
            style={styles.smallInput}
            value={language}
            onChangeText={setLanguage}
            placeholder="ja-JP, en-US, etc."
            placeholderTextColor="#999"
          />
        </View>

        {/* 音声設定 */}
        <View style={styles.section}>
          <Text style={styles.label}>音声設定</Text>
          <View style={styles.settingsRow}>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>ピッチ: {pitch.toFixed(1)}</Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={() => setPitch(Math.max(0.5, pitch - 0.1))}
                >
                  <Text style={styles.buttonText}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={() => setPitch(Math.min(2.0, pitch + 0.1))}
                >
                  <Text style={styles.buttonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>速度: {rate.toFixed(1)}</Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={() => setRate(Math.max(0.5, rate - 0.1))}
                >
                  <Text style={styles.buttonText}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={() => setRate(Math.min(2.0, rate + 0.1))}
                >
                  <Text style={styles.buttonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* 音声選択 */}
        {availableVoices.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>利用可能な音声 ({availableVoices.length}件)</Text>
            <ScrollView style={styles.voicesList} nestedScrollEnabled>
              {availableVoices
                .filter((v) => v.language.startsWith(language.split("-")[0]))
                .slice(0, 10)
                .map((voice) => (
                  <TouchableOpacity
                    key={voice.identifier}
                    style={[
                      styles.voiceItem,
                      selectedVoice === voice.identifier && styles.voiceItemSelected,
                    ]}
                    onPress={() => setSelectedVoice(voice.identifier)}
                  >
                    <Text style={styles.voiceName}>{voice.name}</Text>
                    <Text style={styles.voiceLanguage}>{voice.language}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        )}

        {/* コントロールボタン */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, styles.speakButton, isSpeaking && styles.speakButtonActive]}
            onPress={handleSpeak}
            disabled={isSpeaking}
          >
            <Text style={styles.controlButtonText}>
              {isSpeaking ? "再生中..." : "音声合成"}
            </Text>
          </TouchableOpacity>

          <View style={styles.buttonRow}>
            {Platform.OS === "ios" && (
              <>
                <TouchableOpacity
                  style={[styles.controlButton, styles.secondaryButton]}
                  onPress={handlePause}
                  disabled={!isSpeaking}
                >
                  <Text style={styles.controlButtonText}>一時停止</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.controlButton, styles.secondaryButton]}
                  onPress={handleResume}
                  disabled={isSpeaking}
                >
                  <Text style={styles.controlButtonText}>再開</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              style={[styles.controlButton, styles.stopButton]}
              onPress={handleStop}
              disabled={!isSpeaking}
            >
              <Text style={styles.controlButtonText}>停止</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 情報表示 */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            最大文字数: {Speech.maxSpeechInputLength.toLocaleString()}
          </Text>
          <Text style={styles.infoText}>
            現在の状態: {isSpeaking ? "再生中" : "停止中"}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
    backgroundColor: "#fafafa",
  },
  smallInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  settingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  settingItem: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },
  smallButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 50,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  voicesList: {
    maxHeight: 200,
    marginTop: 8,
  },
  voiceItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#fafafa",
  },
  voiceItemSelected: {
    backgroundColor: "#E3F2FD",
    borderColor: "#007AFF",
  },
  voiceName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  voiceLanguage: {
    fontSize: 12,
    color: "#666",
  },
  controls: {
    padding: 16,
    marginTop: 12,
  },
  controlButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  speakButton: {
    backgroundColor: "#007AFF",
  },
  speakButtonActive: {
    backgroundColor: "#0051D5",
    opacity: 0.7,
  },
  secondaryButton: {
    backgroundColor: "#34C759",
    flex: 1,
  },
  stopButton: {
    backgroundColor: "#FF3B30",
    flex: 1,
  },
  controlButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  infoSection: {
    padding: 16,
    backgroundColor: "#fff",
    marginTop: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
  },
  infoText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  navLinksContainer: {
    marginTop: 12,
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
  navLinkHalf: {
    flex: 1,
  },
  navLinkText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});

