import { View, ScrollView, StyleSheet } from "react-native"
import Clipboard from "@react-native-clipboard/clipboard"

import { Button } from "@/components/Button"
import { Header } from "@/components/Header"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { AppStackScreenProps } from "@/navigators/AppNavigator"
import { loadLectureSessions } from "@/services/lectureSessionStorage"

type Props = AppStackScreenProps<"LectureSession">

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  const hh = Math.floor(totalSeconds / 3600)
  const mm = Math.floor((totalSeconds % 3600) / 60)
  const ss = totalSeconds % 60
  if (hh > 0)
    return `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`
  return `${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`
}

function formatYouTubeTimestamps(session: any, outlineItemsMap: Record<string, string> = {}) {
  // Output lines like: 00:01 Topic title
  return session.itemTimestamps
    .map((t: any) => {
      const ts = formatDuration(
        t.timestamp - session.startedAt - (computePausedBefore(session, t.timestamp) || 0),
      )
      const title = outlineItemsMap[t.itemId] || "Item"
      return `${ts} ${title}`
    })
    .join("\n")
}

function computePausedBefore(session: any, timestamp: number) {
  // Sum of paused durations that started before the timestamp
  if (!session.pausedIntervals || session.pausedIntervals.length === 0) return 0
  return session.pausedIntervals.reduce((acc: number, p: any) => {
    if (p.start >= timestamp) return acc
    const end = Math.min(p.end || timestamp, timestamp)
    return acc + Math.max(0, end - p.start)
  }, 0)
}

function generateFFmpegTrimCommand(
  session: any,
  inputFile = "input.mp4",
  outputFile = "output.mp4",
) {
  // Create a list of non-paused segments using startedAt, pausedIntervals, and completedAt
  const start = session.startedAt
  const end = session.completedAt || Date.now()
  const paused = session.pausedIntervals || []

  // Build segments of [segmentStart, segmentEnd]
  const segments: Array<[number, number]> = []
  let cursor = start
  paused.forEach((p: any) => {
    if (p.start > cursor) segments.push([cursor, p.start])
    cursor = Math.max(cursor, p.end || p.start)
  })
  if (cursor < end) segments.push([cursor, end])

  // Convert to ffmpeg trim commands: -ss <start> -to <end> -c copy tmpN.mp4
  const cmds = segments
    .map((s, i) => {
      const sSec = ((s[0] - start) / 1000).toFixed(3)
      const eSec = ((s[1] - start) / 1000).toFixed(3)
      return `ffmpeg -i ${inputFile} -ss ${sSec} -to ${eSec} -c copy part${i}.mp4`
    })
    .join("\n")
  return `${cmds}\n# Then concat parts into ${outputFile}`
}

export const LectureSessionScreen = ({ route, navigation }: Props) => {
  const { sessionId } = route.params
  const sessions = loadLectureSessions()
  const session = sessions.find((s) => s.id === sessionId) as any | undefined

  const handleCopyTimestamps = () => {
    if (!session) return
    const txt = formatYouTubeTimestamps(session)
    Clipboard.setString(txt)
  }

  const handleCopyFFmpeg = () => {
    if (!session) return
    const cmd = generateFFmpegTrimCommand(session)
    Clipboard.setString(cmd)
  }

  return (
    <Screen preset="fixed">
  <Header title="Session" leftIcon="back" onLeftPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.container}>
        {!session ? (
          <Text>Session not found</Text>
        ) : (
          <>
            <View style={styles.row}>
              <Text preset="subheading">Started:</Text>
              <Text>{new Date(session.startedAt).toLocaleString()}</Text>
            </View>

            <View style={styles.row}>
              <Text>Marks:</Text>
              <Text>{session.itemTimestamps.length}</Text>
            </View>

            <View style={styles.row}>
              <Text>Paused intervals:</Text>
              <Text>{session.pausedIntervals.length}</Text>
            </View>

            <View style={{ marginTop: 12 }}>
              <Text preset="subheading">YouTube Timestamps</Text>
              <Text style={styles.code}>{formatYouTubeTimestamps(session)}</Text>
              <Button text="Copy Timestamps" onPress={handleCopyTimestamps} />
            </View>

            <View style={{ marginTop: 12 }}>
              <Text preset="subheading">FFmpeg Trim Commands</Text>
              <Text style={styles.code}>{generateFFmpegTrimCommand(session)}</Text>
              <Button text="Copy FFmpeg" onPress={handleCopyFFmpeg} />
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  code: {
    backgroundColor: "#f3f3f3",
    borderRadius: 4,
    fontFamily: "monospace",
    marginVertical: 8,
    padding: 8,
  },
  container: {
    padding: 16,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
})
