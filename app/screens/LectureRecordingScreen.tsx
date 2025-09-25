import { FC, useCallback, useEffect, useState } from "react"
import { FlatList, View, ViewStyle, TextStyle, Alert, TouchableOpacity } from "react-native"
import { TouchableWithoutFeedback } from "react-native"
import { SquarePause, SquarePlay, SquareStop } from "lucide-react-native"

import { Button } from "@/components/Button"
import { Header } from "@/components/Header"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackScreenProps } from "@/navigators/AppNavigator"
import { lectureTimerService, TimerState } from "@/services/lectureTimerService"
import { spacing } from "@/theme/spacing"

interface LectureRecordingScreenProps extends AppStackScreenProps<"LectureRecording"> { }

export const LectureRecordingScreen: FC<LectureRecordingScreenProps> = (props) => {
  const { route, navigation } = props
  const { outline } = route.params

  const [timerState, setTimerState] = useState<TimerState>(lectureTimerService.getTimerState())
  const [elapsedTime, setElapsedTime] = useState(0)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

  // Update timer state and elapsed time
  useEffect(() => {
    const unsubscribe = lectureTimerService.addListener((state) => {
      setTimerState(state)
    })

    // Update elapsed time every 100ms
    const interval = setInterval(() => {
      setElapsedTime(lectureTimerService.getElapsedTime())
    }, 100)

    return () => {
      unsubscribe()
      clearInterval(interval)
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
    },
    [checkedItems],
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
    ({ item, index }: { item: { id: string; title: string }; index: number }) => {
      const isChecked = checkedItems.has(item.id)

      return (
        <TouchableOpacity
          style={[
            $outlineItem,
            isChecked && $outlineItemChecked,
            isChecked && $outlineItemDisabled,
          ]}
          onPress={() => handleToggleItem(item.id)}
          disabled={isChecked}
        >
          <View style={$itemNumberContainer}>
            <Text style={[$itemNumber, isChecked && $itemNumberChecked]}>{index + 1}</Text>
          </View>
          <Text style={[$outlineItemText, isChecked && $outlineItemTextChecked]}>{item.title}</Text>
          <View style={[$checkbox, isChecked && $checkboxChecked]}>
            {isChecked && <Text style={$checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>
      )
    },
    [checkedItems, handleToggleItem],
  )

  return (
    <Screen style={$root} preset="fixed" contentContainerStyle={$screenContentInner}>
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

        {/* Outline Checklist */}
        <View style={$checklistContainer}>
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

const $checklistContainer: ViewStyle = {
  flex: 1,
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
