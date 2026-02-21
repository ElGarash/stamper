import { FC, useCallback, useEffect, useState } from "react"
import {
  FlatList,
  View,
  ViewStyle,
  ImageStyle,
  TextStyle,
  Alert,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native"
import { TouchableWithoutFeedback } from "react-native"
import { SquarePause, SquarePlay, SquareStop } from "lucide-react-native"
import CodeHighlighter from "react-native-code-highlighter"
import Markdown from "react-native-markdown-display"
import atomOneDarkReasonable from "react-syntax-highlighter/dist/esm/styles/hljs/atom-one-dark-reasonable"

import { Button } from "@/components/Button"
import { Header } from "@/components/Header"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackScreenProps } from "@/navigators/AppNavigator"
import { loadPausedLectureState } from "@/services/lectureSessionStorage"
import { lectureTimerService, TimerState } from "@/services/lectureTimerService"
import { getOutlineById } from "@/services/outlineStorage"
import { spacing } from "@/theme/spacing"

interface LectureRecordingScreenProps extends AppStackScreenProps<"LectureRecording"> { }

type OutlineItem = { id: string; title: string; notes?: string }

const MarkdownCodeHighlighter = CodeHighlighter as any

const markdownRules = {
  fence: (node: any) => {
    const language = (node?.info || "").trim().split(/\s+/)[0] || "plaintext"
    const content = typeof node?.content === "string" ? node.content : ""
    const key = node?.key || `fence_${language}_${content.slice(0, 24)}`

    return (
      <View key={key} style={$codeBlockWrapper}>
        <MarkdownCodeHighlighter
          hljsStyle={atomOneDarkReasonable}
          containerStyle={$codeHighlighterContainer}
          scrollViewProps={{ contentContainerStyle: $codeHighlighterContentContainer }}
          textStyle={$codeBlockText}
          language={language}
        >
          {content.replace(/\n$/, "")}
        </MarkdownCodeHighlighter>
      </View>
    )
  },
  image: (node: any) => {
    const source = node?.attributes?.src
    if (!source || typeof source !== "string") return null

    const key = node?.key || `image_${source}`

    return <Image key={key} source={{ uri: source }} style={$markdownImage} resizeMode="contain" />
  },
}

function getDisplayTitle(title: string): string {
  const leadingSpaceMatch = title.match(/^( +)/)
  const leadingSpaces = leadingSpaceMatch ? leadingSpaceMatch[1].length : 0
  return leadingSpaces > 0 ? title.slice(leadingSpaces) : title
}

export const LectureRecordingScreen: FC<LectureRecordingScreenProps> = (props) => {
  const { route, navigation } = props
  const { outline } = route.params

  const [timerState, setTimerState] = useState<TimerState>(lectureTimerService.getTimerState())
  const [elapsedTime, setElapsedTime] = useState(0)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [notesItemId, setNotesItemId] = useState<string | undefined>(outline.items[0]?.id)
  const outlineItems: OutlineItem[] = outline.items

  // Update timer state and elapsed time
  useEffect(() => {
    const unsubscribe = lectureTimerService.addListener((state) => {
      setTimerState(state)
    })

    // Hydrate checked items immediately if there's an existing (paused) session
    if (checkedItems.size === 0) {
      const existingSession = lectureTimerService.getCurrentSession?.()
      if (existingSession) {
        let covered =
          lectureTimerService.getCoveredItemIds?.() ||
          lectureTimerService.getCheckedItemIds?.() ||
          []
        if (covered.length === 0 && existingSession.itemTimestamps?.length) {
          covered = existingSession.itemTimestamps.map((t: any) => t.itemId)
        }
        if (covered.length > 0) {
          setCheckedItems(new Set(covered))
        }
      }
    }

    // Update elapsed time every 100ms
    const interval = setInterval(() => {
      setElapsedTime(lectureTimerService.getElapsedTime())
    }, 100)

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
    // We intentionally only run this once on mount; checkedItems hydration is idempotent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Attempt to restore paused session once on mount if none active
  useEffect(() => {
    const snapshot = loadPausedLectureState?.()
    const noSession = !lectureTimerService.getCurrentSession?.()
    const needRestore = noSession && snapshot
    if (needRestore) {
      const restored = lectureTimerService.restorePausedLecture?.()
      if (restored) {
        const ids = lectureTimerService.getCheckedItemIds?.() || []
        // Fallback: if service returns empty but session has timestamps, rebuild
        if (ids.length === 0) {
          const session = lectureTimerService.getCurrentSession?.()
          if (session) {
            const rebuilt = session.itemTimestamps.map((t) => t.itemId)
            if (rebuilt.length > 0) {
              setCheckedItems(new Set(rebuilt))
            }
          }
        } else {
          setCheckedItems(new Set(ids))
        }
      }
    }
  }, [])

  // We no longer auto-start; user explicitly starts the recording.
  // This prevents the screen from briefly (or permanently) showing a paused state at 0s.

  const hasStarted = timerState.startTime !== null
  const isPaused = hasStarted && !timerState.isRunning

  const handleStartLecture = useCallback(() => {
    if (!hasStarted) {
      lectureTimerService.startLecture(outline)
      setCheckedItems(new Set()) // reset any prior state just in case
    }
  }, [hasStarted, outline])

  const handleToggleItem = useCallback(
    (itemId: string) => {
      // If already checked, do nothing (prevent unchecking)
      if (checkedItems.has(itemId)) return

      const newCheckedItems = new Set(checkedItems)
      newCheckedItems.add(itemId)
      lectureTimerService.logItemCovered(itemId)
      setCheckedItems(newCheckedItems)

      const checkedItemIndex = outlineItems.findIndex((item) => item.id === itemId)
      const nextItem = checkedItemIndex >= 0 ? outlineItems[checkedItemIndex + 1] : undefined
      setNotesItemId(nextItem?.id)
    },
    [checkedItems, outlineItems],
  )

  const handlePauseResume = useCallback(() => {
    if (!hasStarted) return
    if (timerState.isRunning) {
      lectureTimerService.pauseLecture()
    } else {
      lectureTimerService.resumeLecture()
    }
  }, [timerState.isRunning, hasStarted])

  const handleStopLecture = useCallback(() => {
    Alert.alert("Stop Lecture", "Are you sure you want to stop the lecture recording?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Stop",
        style: "destructive",
        onPress: () => {
          const session = lectureTimerService.stopLecture()
          if (session) {
            // Navigate to session detail screen for export
            navigation.navigate("LectureSession", { sessionId: session.id })
          }
        },
      },
    ])
  }, [navigation])

  const renderOutlineItem = useCallback(
    ({ item, index }: { item: OutlineItem; index: number }) => {
      const isChecked = checkedItems.has(item.id)

      // Determine nesting level from leading spaces (each 2 spaces = 1 level) added during markdown flattening
      // Example stored title: "    Subtopic" (4 leading spaces -> level 2)
      const leadingSpaceMatch = item.title.match(/^( +)/)
      const leadingSpaces = leadingSpaceMatch ? leadingSpaceMatch[1].length : 0
      const level = Math.floor(leadingSpaces / 2)
      const displayTitle = getDisplayTitle(item.title)

      // Indent the entire card instead of showing spaces inside the text
      const indentStyle: ViewStyle = level > 0 ? { marginLeft: level * 18 } : {}

      return (
        <TouchableOpacity
          style={[
            $outlineItem,
            isChecked && $outlineItemChecked,
            isChecked && $outlineItemDisabled,
            indentStyle,
          ]}
          onPress={() => handleToggleItem(item.id)}
          disabled={isChecked}
        >
          <View style={$itemNumberContainer}>
            <Text style={[$itemNumber, isChecked && $itemNumberChecked]}>{index + 1}</Text>
          </View>
          <Text style={[$outlineItemText, isChecked && $outlineItemTextChecked]}>
            {displayTitle}
          </Text>
          <View style={[$checkbox, isChecked && $checkboxChecked]}>
            {isChecked && <Text style={$checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>
      )
    },
    [checkedItems, handleToggleItem],
  )

  // Fallback to load outline items if items array is empty (resume flow)
  useEffect(() => {
    if (outline && outline.items.length === 0) {
      const loaded = getOutlineById(outline.id)
      if (loaded && loaded.items.length > 0) {
        // mutate route params outline reference items so FlatList updates
        // (route params object is stable, but items ref replaced)
        // @ts-ignore
        route.params.outline.items = loaded.items
      }
    }
  }, [outline, route.params])

  // Ensure the notes target always points to a valid item when outline data changes
  useEffect(() => {
    if (outlineItems.length === 0) {
      if (notesItemId) setNotesItemId(undefined)
      return
    }

    if (!notesItemId || !outlineItems.some((item) => item.id === notesItemId)) {
      const firstUnchecked = outlineItems.find((item) => !checkedItems.has(item.id))
      setNotesItemId((firstUnchecked || outlineItems[0]).id)
    }
  }, [outlineItems, notesItemId, checkedItems])

  const activeNotesItem = notesItemId
    ? outlineItems.find((item) => item.id === notesItemId)
    : undefined

  return (
    <Screen
      style={$root}
      preset="fixed"
      contentContainerStyle={$screenContentInner}
      safeAreaEdges={["top", "bottom"]}
    >
      <Header
        title="Recording Lecture"
        leftIcon="back"
        onLeftPress={() => navigation.goBack()}
        style={$headerContainer}
      />

      <View style={$contentContainer}>
        {/* Timer Display */}
        <View style={$timerContainer}>
          <Text style={$timerLabel}>Elapsed Time</Text>
          <Text style={$timerText}>{lectureTimerService.formatTime(elapsedTime, true)}</Text>
          <Text style={$timerStatus}>
            {!hasStarted && "🟡 Not started"}
            {hasStarted && timerState.isRunning && "🔴 Recording"}
            {isPaused && "⏸️ Paused"}
          </Text>
        </View>

        {/* Control Buttons */}
        <View style={$controlButtonsContainer}>
          {!hasStarted ? (
            <Button
              text="Start"
              onPress={handleStartLecture}
              style={$pauseResumeButton}
              preset="filled"
              LeftAccessory={(props) => (
                <SquarePlay
                  size={22}
                  color="#FFFFFF"
                  // eslint-disable-next-line react-native/no-inline-styles
                  style={[props.style, { marginEnd: 4 }]}
                />
              )}
            />
          ) : (
            <Button
              text={timerState.isRunning ? "Pause" : "Resume"}
              onPress={handlePauseResume}
              style={$pauseResumeButton}
              preset={timerState.isRunning ? "reversed" : "default"}
              LeftAccessory={(props) =>
                timerState.isRunning ? (
                  <SquarePause
                    size={22}
                    color={timerState.isRunning ? "#FFFFFF" : "#162033"}
                    // eslint-disable-next-line react-native/no-inline-styles
                    style={[props.style, { marginEnd: 4 }]}
                  />
                ) : (
                  <SquarePlay
                    size={22}
                    color={"#162033"}
                    // eslint-disable-next-line react-native/no-inline-styles
                    style={[props.style, { marginEnd: 4 }]}
                  />
                )
              }
            />
          )}
          <Button
            text="Stop"
            onPress={handleStopLecture}
            style={$stopButton}
            preset="filled"
            disabled={!hasStarted}
            LeftAccessory={(props) => (
              <SquareStop
                size={22}
                color="#FFFFFF"
                // eslint-disable-next-line react-native/no-inline-styles
                style={[props.style, { marginEnd: 4 }]}
              />
            )}
          />
        </View>

        <View style={$splitContainer}>
          {/* Outline Checklist */}
          <View style={$checklistPane}>
            <Text style={$checklistHeader}>
              Tap items as you cover them ({checkedItems.size}/{outline.items.length} completed)
            </Text>
            <FlatList
              data={outline.items}
              renderItem={renderOutlineItem}
              keyExtractor={(item) => item.id}
              style={$itemsList}
              contentContainerStyle={$itemsListContent}
              scrollEnabled={true}
            />
          </View>

          <View style={$notesPane}>
            <Text style={$notesLabel}>Notes</Text>
            {activeNotesItem ? (
              <>
                <Text style={$notesTitle}>{getDisplayTitle(activeNotesItem.title)}</Text>
                {activeNotesItem.notes?.trim() ? (
                  <ScrollView style={$notesScroll} contentContainerStyle={$notesScrollContent}>
                    <Markdown style={markdownStyles} rules={markdownRules}>
                      {activeNotesItem.notes}
                    </Markdown>
                  </ScrollView>
                ) : (
                  <View style={$notesEmptyState}>
                    <Text style={$notesEmptyStateText}>No notes for this item.</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={$notesEmptyState}>
                <Text style={$notesEmptyStateText}>All items are completed.</Text>
              </View>
            )}
          </View>
        </View>
        {/* Paused Backdrop - full screen overlay when paused */}
        {isPaused && (
          <TouchableWithoutFeedback onPress={() => lectureTimerService.resumeLecture()}>
            <View style={$pausedBackdrop}>
              <Text style={$pausedBackdropText}>Paused — tap anywhere to resume</Text>
            </View>
          </TouchableWithoutFeedback>
        )}
      </View>
    </Screen>
  )
}

const $root: ViewStyle = {
  flex: 1,
}

const $headerContainer: ViewStyle = {
  marginBottom: spacing.md,
}

const $contentContainer: ViewStyle = {
  padding: spacing.md,
  flex: 1,
}

const $timerContainer: ViewStyle = {
  alignItems: "center",
  backgroundColor: "#FFFFFF",
  borderRadius: 14,
  padding: spacing.lg,
  marginBottom: spacing.md,
  borderWidth: 3,
  borderColor: "#162033",
  shadowColor: "#0D1624",
  shadowOffset: { width: 6, height: 6 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 8,
}

const $timerLabel: TextStyle = {
  fontSize: 14,
  color: "#4A5563",
  marginBottom: spacing.xs,
  fontWeight: "500",
}

const $timerText: TextStyle = {
  fontSize: 36,
  fontWeight: "700",
  color: "#FF7A00",
  fontFamily: "jetBrainsMonoBold",
  letterSpacing: 1,
  lineHeight: 44, // prevent visual clipping of glyph ascenders
  paddingTop: 2, // extra breathing room for Android font metrics
  textAlign: "center",
}

const $timerStatus: TextStyle = {
  fontSize: 14,
  color: "#273041",
  marginTop: spacing.xs,
  fontWeight: "500",
}

const $controlButtonsContainer: ViewStyle = {
  flexDirection: "row",
  gap: spacing.sm,
  marginBottom: spacing.md,
}

const $pauseResumeButton: ViewStyle = {
  flex: 1,
}

const $stopButton: ViewStyle = {
  flex: 1,
  backgroundColor: "#FF3B30",
}

const $splitContainer: ViewStyle = {
  flex: 1,
  flexDirection: "row",
  gap: spacing.sm,
}

const $checklistPane: ViewStyle = {
  flex: 1.1,
}

const $notesPane: ViewStyle = {
  flex: 1,
  borderLeftWidth: 2,
  borderLeftColor: "#162033",
  paddingLeft: spacing.sm,
}

const $notesLabel: TextStyle = {
  color: "#4A5563",
  fontSize: 12,
  fontWeight: "600",
  marginBottom: spacing.xs,
  textTransform: "uppercase",
}

const $notesTitle: TextStyle = {
  color: "#162033",
  fontSize: 16,
  fontWeight: "700",
  marginBottom: spacing.xs,
}

const $notesScroll: ViewStyle = {
  flex: 1,
}

const $notesScrollContent: ViewStyle = {
  paddingBottom: spacing.md,
}

const $notesEmptyState: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: spacing.sm,
}

const $notesEmptyStateText: TextStyle = {
  textAlign: "center",
  color: "#666",
}

const $codeBlockWrapper: ViewStyle = {
  marginVertical: spacing.xs,
  borderWidth: 1,
  borderColor: "#162033",
  borderRadius: 8,
  overflow: "hidden",
  backgroundColor: "#282C34",
}

const $codeHighlighterContainer: ViewStyle = {
  padding: spacing.sm,
}

const $codeHighlighterContentContainer: ViewStyle = {
  minWidth: "100%",
}

const $codeBlockText: TextStyle = {
  color: "#ABB2BF",
  fontFamily: "jetBrainsMono",
  fontSize: 13,
  lineHeight: 20,
}

const $pausedBackdrop: ViewStyle = {
  position: "absolute",
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.55)",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
}

const $pausedBackdropText: TextStyle = {
  color: "white",
  fontSize: 18,
  textAlign: "center",
  paddingHorizontal: spacing.md,
}

const $checklistHeader: TextStyle = {
  textAlign: "center",
  color: "#666",
  marginBottom: spacing.md,
  fontSize: 14,
}

const $itemsList: ViewStyle = {
  flex: 1,
}

const $itemsListContent: ViewStyle = {
  paddingBottom: spacing.lg,
  flexGrow: 1,
}

const $screenContentInner: ViewStyle = {
  flex: 1,
  justifyContent: "flex-start",
  alignItems: "stretch",
}

const $outlineItem: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.md,
  marginVertical: spacing.xs,
  backgroundColor: "#FFFFFF",
  borderRadius: 12,
  borderWidth: 3,
  borderColor: "#162033",
  shadowColor: "#0D1624",
  shadowOffset: { width: 4, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 6,
}

const $outlineItemChecked: ViewStyle = {
  backgroundColor: "#FFE8D6",
  borderColor: "#FF7A00",
}

// Once an item is checked (and no longer tappable) we slightly reduce opacity to signal it's locked
const $outlineItemDisabled: ViewStyle = {
  opacity: 0.9,
}

const $itemNumberContainer: ViewStyle = {
  width: 36,
  height: 36,
  borderRadius: 8,
  backgroundColor: "#FF7A00",
  justifyContent: "center",
  alignItems: "center",
  marginRight: spacing.sm,
  borderWidth: 2,
  borderColor: "#162033",
}

const $itemNumber: TextStyle = {
  fontWeight: "600",
  color: "#FFFFFF",
  fontSize: 16,
}

const $itemNumberChecked: TextStyle = {
  color: "#FFFFFF",
}

const $outlineItemText: TextStyle = {
  flex: 1,
  fontSize: 16,
  color: "#273041",
  fontWeight: "500",
}

const $outlineItemTextChecked: TextStyle = {
  color: "#162033",
  textDecorationLine: "line-through",
}

const $checkbox: ViewStyle = {
  width: 28,
  height: 28,
  borderWidth: 3,
  borderColor: "#162033",
  borderRadius: 6,
  justifyContent: "center",
  alignItems: "center",
  marginLeft: spacing.sm,
  backgroundColor: "#FFFFFF",
}

const $checkboxChecked: ViewStyle = {
  backgroundColor: "#FF7A00",
  borderColor: "#162033",
}

const $checkmark: TextStyle = {
  color: "#FFFFFF",
  fontSize: 18,
  fontWeight: "bold",
}

const markdownStyles = {
  body: {
    color: "#273041",
    fontSize: 14,
    lineHeight: 20,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: spacing.xs,
  },
  heading1: {
    color: "#162033",
    fontSize: 18,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  heading2: {
    color: "#162033",
    fontSize: 16,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  heading3: {
    color: "#162033",
    fontSize: 15,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  code_inline: {
    backgroundColor: "#FFE8D6",
    color: "#162033",
    borderRadius: 4,
    paddingHorizontal: 4,
  },
} as const

const $markdownImage: ImageStyle = {
  width: "100%",
  minHeight: 180,
  marginVertical: spacing.xs,
}
