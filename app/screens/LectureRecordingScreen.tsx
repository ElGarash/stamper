import { FC, useCallback, useEffect, useState } from "react"
import { FlatList, View, ViewStyle, TextStyle, Alert, TouchableOpacity } from "react-native"
import { TouchableWithoutFeedback } from "react-native"

import { Button } from "@/components/Button"
import { Header } from "@/components/Header"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackScreenProps } from "@/navigators/AppNavigator"
import { lectureTimerService, TimerState } from "@/services/lectureTimerService"
import { spacing } from "@/theme/spacing"

interface LectureRecordingScreenProps extends AppStackScreenProps<"LectureRecording"> {}

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

  // Start the lecture timer when component mounts
  useEffect(() => {
    lectureTimerService.startLecture(outline)
  }, [outline])

  const handleToggleItem = useCallback(
    (itemId: string) => {
      const newCheckedItems = new Set(checkedItems)

      if (newCheckedItems.has(itemId)) {
        // Unchecking item
        newCheckedItems.delete(itemId)
        lectureTimerService.removeItemTimestamp(itemId)
      } else {
        // Checking item
        newCheckedItems.add(itemId)
        lectureTimerService.logItemCovered(itemId)
      }

      setCheckedItems(newCheckedItems)
    },
    [checkedItems],
  )

  const handlePauseResume = useCallback(() => {
    if (timerState.isRunning) {
      lectureTimerService.pauseLecture()
    } else {
      lectureTimerService.resumeLecture()
    }
  }, [timerState.isRunning])

  const handleStopLecture = useCallback(() => {
    Alert.alert("Stop Lecture", "Are you sure you want to stop the lecture recording?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Stop",
        style: "destructive",
        onPress: () => {
          const session = lectureTimerService.stopLecture()
          if (session) {
            // TODO: Navigate to export screen with session data
            Alert.alert("Lecture Stopped", "Session data saved successfully!")
            navigation.goBack()
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
          style={[$outlineItem, isChecked && $outlineItemChecked]}
          onPress={() => handleToggleItem(item.id)}
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
          <Text style={$timerStatus}>{timerState.isRunning ? "🔴 Recording" : "⏸️ Paused"}</Text>
        </View>

        {/* Control Buttons */}
        <View style={$controlButtonsContainer}>
          <Button
            text={timerState.isRunning ? "⏸️ Pause" : "▶️ Resume"}
            onPress={handlePauseResume}
            style={$pauseResumeButton}
            preset={timerState.isRunning ? "reversed" : "default"}
          />
          <Button
            text="⏹️ Stop & Export"
            onPress={handleStopLecture}
            style={$stopButton}
            preset="filled"
          />
        </View>

        {/* Outline Checklist */}
        <View style={$checklistContainer}>
          <Text preset="subheading" text={outline.title} style={$outlineTitle} />
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
        {!timerState.isRunning && (
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
  backgroundColor: "#f8f9fa",
  borderRadius: spacing.md,
  padding: spacing.lg,
  marginBottom: spacing.md,
  borderWidth: 2,
  borderColor: "#007AFF",
}

const $timerLabel: TextStyle = {
  fontSize: 16,
  color: "#666",
  marginBottom: spacing.xs,
}

const $timerText: TextStyle = {
  fontSize: 32,
  fontWeight: "bold",
  color: "#007AFF",
  fontFamily: "monospace",
}

const $timerStatus: TextStyle = {
  fontSize: 14,
  color: "#666",
  marginTop: spacing.xs,
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

const $outlineTitle: TextStyle = {
  textAlign: "center",
  marginBottom: spacing.sm,
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
  backgroundColor: "#f5f5f5",
  borderRadius: spacing.sm,
  borderLeftWidth: 4,
  borderLeftColor: "#007AFF",
}

const $outlineItemChecked: ViewStyle = {
  backgroundColor: "#e8f5e8",
  borderLeftColor: "#34C759",
}

const $itemNumberContainer: ViewStyle = {
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: "#f0f0f0",
  justifyContent: "center",
  alignItems: "center",
  marginRight: spacing.sm,
}

const $itemNumber: TextStyle = {
  fontWeight: "600",
  color: "#666",
}

const $itemNumberChecked: TextStyle = {
  color: "#34C759",
}

const $outlineItemText: TextStyle = {
  flex: 1,
  fontSize: 16,
  color: "#333333",
}

const $outlineItemTextChecked: TextStyle = {
  color: "#34C759",
  textDecorationLine: "line-through",
}

const $checkbox: ViewStyle = {
  width: 24,
  height: 24,
  borderWidth: 2,
  borderColor: "#ccc",
  borderRadius: 4,
  justifyContent: "center",
  alignItems: "center",
  marginLeft: spacing.sm,
}

const $checkboxChecked: ViewStyle = {
  backgroundColor: "#34C759",
  borderColor: "#34C759",
}

const $checkmark: TextStyle = {
  color: "white",
  fontSize: 16,
  fontWeight: "bold",
}
