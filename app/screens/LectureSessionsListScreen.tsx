import { FC, useCallback, useState } from "react"
import { View, ViewStyle, FlatList, TouchableOpacity, Alert } from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import {
  ClockArrowDown as LucideClockArrowDown,
  ClockArrowUp as LucideClockArrowUp,
} from "lucide-react-native"
import { Trash } from "lucide-react-native"
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable"
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from "react-native-reanimated"

import { Header } from "@/components/Header"
import { ListItem } from "@/components/ListItem"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackScreenProps } from "@/navigators/AppNavigator"
import { getSessionsForOutline, deleteLectureSession } from "@/services/lectureSessionStorage"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"

type Props = AppStackScreenProps<"LectureSessionsList">

const RightSwipeActions = ({
  progress,
  onPressDelete,
  theme,
}: {
  progress: SharedValue<number>
  onPressDelete: () => void
  theme: any
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP)
    const translateXDelete = interpolate(progress.value, [0, 1], [60, 0], Extrapolation.CLAMP)

    return {
      opacity,
      transform: [{ translateX: translateXDelete }],
    }
  })

  return (
    <View style={$swipeActionsContainer}>
      <Animated.View style={[$deleteIcon, animatedStyle]}>
        <TouchableOpacity onPress={onPressDelete}>
          <Trash size={24} color={theme.colors.error} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

export const LectureSessionsListScreen: FC<Props> = ({ route, navigation }) => {
  const { outlineId } = route.params
  const [sessions, setSessions] = useState<any[]>([])
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")
  const { theme } = useAppTheme()

  const load = useCallback(() => {
    const allSessions = getSessionsForOutline(outlineId)
    const sorted = [...allSessions].sort((a, b) => {
      const aTime = new Date(a.startedAt).getTime()
      const bTime = new Date(b.startedAt).getTime()
      if (sortOrder === "newest") {
        return bTime - aTime
      } else {
        return aTime - bTime
      }
    })
    setSessions(sorted)
  }, [outlineId, sortOrder])

  const handleDelete = useCallback(
    (sessionId: string) => {
      const session = sessions.find((s) => s.id === sessionId)
      const dateLabel = session ? new Date(session.startedAt).toLocaleString() : "this session"
      Alert.alert("Delete Session", `Are you sure you want to delete ${dateLabel}?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const success = deleteLectureSession(sessionId)
            if (success) {
              load()
            } else {
              Alert.alert("Error", "Failed to delete session")
            }
          },
        },
      ])
    },
    [sessions, load],
  )

  const renderRightActions = useCallback(
    (sessionId: string, progress: SharedValue<number>) => {
      return (
        <RightSwipeActions
          progress={progress}
          onPressDelete={() => handleDelete(sessionId)}
          theme={theme}
        />
      )
    },
    [handleDelete, theme],
  )

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load]),
  )

  return (
    <Screen preset="fixed" safeAreaEdges={["top", "bottom"]}>
      <Header title="Recorded Sessions" leftIcon="back" onLeftPress={() => navigation.goBack()} />
      {/* Row directly beneath the title containing only the sort icon aligned to the right */}
      <View style={$sortRow}>
        <View style={$spacer} />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Toggle sort order"
          onPress={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          {sortOrder === "newest" ? (
            // Newest currently -> icon suggests switching to oldest (narrow-wide)
            <LucideClockArrowDown />
          ) : (
            <LucideClockArrowUp />
          )}
        </TouchableOpacity>
      </View>

      <View style={$content}>
        {sessions.length === 0 ? (
          <Text>No recorded sessions for this outline.</Text>
        ) : (
          <FlatList
            data={sessions}
            keyExtractor={(s) => s.id}
            renderItem={({ item }) => (
              <ReanimatedSwipeable
                renderRightActions={(progress) => renderRightActions(item.id, progress)}
                friction={2}
                overshootFriction={8}
                rightThreshold={40}
              >
                <ListItem
                  text={new Date(item.startedAt).toLocaleString()}
                  onPress={() => navigation.navigate("LectureSession", { sessionId: item.id })}
                  onLongPress={() => handleDelete(item.id)}
                  bottomSeparator
                  RightComponent={<Text size="xs">{item.itemTimestamps.length} marks</Text>}
                />
              </ReanimatedSwipeable>
            )}
          />
        )}
      </View>
    </Screen>
  )
}

const $content: ViewStyle = {
  padding: spacing.md,
}

const $sortRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-end",
  paddingHorizontal: spacing.md,
  marginTop: spacing.sm,
  marginBottom: spacing.xs,
}
const $spacer: ViewStyle = { flex: 1 }

const $swipeActionsContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: spacing.sm,
  backgroundColor: "transparent",
}

const $deleteIcon: ViewStyle = {
  minWidth: 80,
  minHeight: 56,
  justifyContent: "center",
  alignItems: "center",
  marginBottom: spacing.xs,
}
