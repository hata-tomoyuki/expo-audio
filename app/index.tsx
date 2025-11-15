import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { Link } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type VoiceMessage = {
  id: string;
  uri: string;
  from: "user" | "bot";
  durationSec: number;
};

export default function VoiceChatScreen() {
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  // 録音権限のリクエストとオーディオモード設定
  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert("マイクへのアクセスが拒否されました");
        return;
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
    })();
  }, []);

  // 録音時間のタイマー
  useEffect(() => {
    if (recorderState.isRecording) {
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingTime(0);
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [recorderState.isRecording]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDuration = (seconds: number): string => {
    return seconds.toFixed(1) + "s";
  };

  const handleRecord = async () => {
    if (recorderState.isRecording) {
      // 録音停止
      await audioRecorder.stop();
      const uri = audioRecorder.uri;

      if (uri) {
        // 録音時間を取得（簡易版：実際には録音ファイルから取得する必要があります）
        const duration = recordingTime || 1;

        // ユーザーのメッセージを追加
        const userMessage: VoiceMessage = {
          id: Date.now().toString(),
          uri: uri,
          from: "user",
          durationSec: duration,
        };

        setMessages((prev) => [...prev, userMessage]);

        // 1秒後にBotのメッセージを自動追加
        setTimeout(() => {
          // Botは同じ音声ファイルを使用（実際には別の音声ファイルを用意するか、ダミーでOK）
          const botMessage: VoiceMessage = {
            id: (Date.now() + 1).toString(),
            uri: uri, // 実際には別の音声ファイルを用意する
            from: "bot",
            durationSec: duration,
          };
          setMessages((prev) => [...prev, botMessage]);
        }, 1000);
      }
    } else {
      // 録音開始
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    }
  };

  const VoiceMessageItem = ({ item }: { item: VoiceMessage }) => {
    const player = useAudioPlayer(item.uri);
    const status = useAudioPlayerStatus(player);
    const isPlaying = status.playing;

    const handlePlay = () => {
      if (isPlaying) {
        player.pause();
      } else {
        player.seekTo(0);
        player.play();
      }
    };

    const isUser = item.from === "user";

    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.botMessageContainer,
        ]}
      >
        {!isUser && <Text style={styles.messageLabel}>Bot</Text>}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.botBubble,
          ]}
        >
          <TouchableOpacity onPress={handlePlay} style={styles.playButton}>
            <Text style={[styles.playIcon, isUser && styles.playIconUser]}>
              {isPlaying ? "⏸" : "▶︎"}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.durationText, isUser && styles.durationTextUser]}>
            {formatDuration(item.durationSec)}
          </Text>
        </View>
        {isUser && <Text style={styles.messageLabel}>You</Text>}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* タイトルバー */}
      <View style={styles.header}>
        <Text style={styles.title}>VoiceChat Mini</Text>
        <Text style={styles.subtitle}>録音してボイスチャット体験</Text>
        <Link href="/speech" asChild>
          <TouchableOpacity style={styles.navLink}>
            <Text style={styles.navLinkText}>📢 Text-to-Speech へ</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {/* メッセージリスト */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <VoiceMessageItem item={item} />}
        contentContainerStyle={styles.messagesList}
        inverted={false}
      />

      {/* 録音コントロール */}
      <View style={styles.recordingControl}>
        {recorderState.isRecording && (
          <View style={styles.recordingTimer}>
            <Text style={styles.recordingTimerText}>
              Recording {formatTime(recordingTime)}
            </Text>
          </View>
        )}
        <TouchableOpacity
          onPress={handleRecord}
          style={[
            styles.micButton,
            recorderState.isRecording && styles.micButtonRecording,
          ]}
        >
          <Text style={styles.micIcon}>🎤</Text>
        </TouchableOpacity>
        <Text style={styles.recordHint}>
          {recorderState.isRecording
            ? "Recording... Tap to stop"
            : "Tap to record"}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
  messagesList: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  botMessageContainer: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    maxWidth: "70%",
  },
  userBubble: {
    backgroundColor: "#007AFF",
  },
  botBubble: {
    backgroundColor: "#E5E5EA",
  },
  playButton: {
    marginRight: 8,
  },
  playIcon: {
    fontSize: 16,
    color: "#333",
  },
  playIconUser: {
    color: "#fff",
  },
  durationText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  durationTextUser: {
    color: "#fff",
  },
  messageLabel: {
    fontSize: 12,
    color: "#999",
    marginHorizontal: 8,
  },
  recordingControl: {
    padding: 20,
    paddingBottom: 30,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    alignItems: "center",
  },
  recordingTimer: {
    marginBottom: 8,
  },
  recordingTimerText: {
    fontSize: 12,
    color: "#ff3b30",
    fontWeight: "600",
  },
  micButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  micButtonRecording: {
    backgroundColor: "#ff3b30",
  },
  micIcon: {
    fontSize: 32,
  },
  recordHint: {
    fontSize: 12,
    color: "#666",
  },
  navLink: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    alignItems: "center",
  },
  navLinkText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
