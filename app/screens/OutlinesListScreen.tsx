import { FC, useCallback, useEffect, useState } from "react"
import {
  FlatList,
  View,
  ViewStyle,
  TextStyle,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Animated,
} from "react-native"
import { SquarePen, Trash, ListPlus } from "lucide-react-native"
import { Swipeable } from "react-native-gesture-handler"

import { EmptyState } from "@/components/EmptyState"
import { Header } from "@/components/Header"
import { ListItem } from "@/components/ListItem"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Outline } from "@/models/Outline"
import type { AppStackScreenProps } from "@/navigators/AppNavigator"
import { deleteOutline, loadOutlines } from "@/services/outlineStorage"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"

interface OutlinesListScreenProps extends AppStackScreenProps<"OutlinesList"> { }

export const OutlinesListScreen: FC<OutlinesListScreenProps> = function OutlinesListScreen(props) {
  const { navigation } = props
  const { themed, theme } = useAppTheme()

  const [outlines, setOutlines] = useState<Outline[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadOutlinesData = useCallback(() => {
    try {
      const loadedOutlines = loadOutlines()
      setOutlines(loadedOutlines)
    } catch (error) {
      console.error("Failed to load outlines:", error)
      Alert.alert("Error", "Failed to load outlines")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    loadOutlinesData()
  }, [loadOutlinesData])

  const handleDeleteOutline = useCallback(
    (outlineId: string, title: string) => {
      Alert.alert("Delete Outline", `Are you sure you want to delete "${title}"?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const success = deleteOutline(outlineId)
            if (success) {
              loadOutlinesData()
            } else {
              Alert.alert("Error", "Failed to delete outline")
            }
          },
        },
      ])
    },
    [loadOutlinesData],
  )

  const handleEditOutline = useCallback(
    (outline: Outline) => {
      navigation.navigate("OutlineEditor", { outlineId: outline.id })
    },
    [navigation],
  )

  const handleOutlinePress = useCallback(
    (outline: Outline) => {
      navigation.navigate("OutlinePreview", { outlineId: outline.id })
    },
    [navigation],
  )

  const renderRightActions = useCallback(
    (
      outline: Outline,
      dragX: Animated.AnimatedInterpolation<number>,
      progress: Animated.AnimatedInterpolation<number>,
    ) => {
      // Interpolate opacity based on swipe progress (0 -> 1)
      const opacity = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
        extrapolate: "clamp",
      })

      // Slight translate to make it feel smoother
      const translateXEdit = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [40, 0],
        extrapolate: "clamp",
      })
      const translateXDelete = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [60, 0],
        extrapolate: "clamp",
      })

      return (
        <View style={themed($swipeActionsContainer)}>
          <Animated.View
            style={[themed($editIcon), { opacity, transform: [{ translateX: translateXEdit }] }]}
          >
            <TouchableOpacity onPress={() => handleEditOutline(outline)}>
              <SquarePen size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </Animated.View>
          <Animated.View
            style={[
              themed($deleteIcon),
              { opacity, transform: [{ translateX: translateXDelete }] },
            ]}
          >
            <TouchableOpacity onPress={() => handleDeleteOutline(outline.id, outline.title)}>
              <Trash size={24} color={theme.colors.error} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      )
    },
    [handleDeleteOutline, handleEditOutline, themed, theme],
  )

  const handleImportMarkdown = useCallback(() => {
    navigation.navigate("MarkdownImport")
  }, [navigation])

  useEffect(() => {
    loadOutlinesData()
  }, [loadOutlinesData])

  // Refresh data when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadOutlinesData()
    })
    return unsubscribe
  }, [navigation, loadOutlinesData])

  const renderOutlineItem = ({ item: outline }: { item: Outline }) => (
    <View style={themed($itemWrapper)}>
      <Swipeable
        renderRightActions={(progress, dragX) => renderRightActions(outline, dragX, progress)}
        friction={2}
        overshootFriction={8}
        rightThreshold={40}
      >
        <ListItem
          text={outline.title}
          onPress={() => handleOutlinePress(outline)}
          RightComponent={
            <View style={themed($badge)}>
              <Text size="xxs" style={themed($badgeText)}>
                {outline.items.length} {outline.items.length === 1 ? "topic" : "topics"}
              </Text>
            </View>
          }
          containerStyle={themed($listItemContainerNeo)}
          style={themed($touchableNeo)}
          onLongPress={() => handleDeleteOutline(outline.id, outline.title)}
        />
      </Swipeable>
    </View>
  )

  const renderEmptyState = () => (
    <EmptyState
      preset="generic"
      content="No outlines yet. Import a markdown list to get started!"
      button="Import Markdown"
      buttonOnPress={handleImportMarkdown}
      heading="No Outlines"
    />
  )

  if (isLoading) {
    return (
      <Screen preset="fixed" contentContainerStyle={themed($screenContainer)}>
        <Header title="Outlines" />
        <View style={themed($loadingContainer)}>
          <Text>Loading outlines...</Text>
        </View>
      </Screen>
    )
  }

  return (
    <Screen preset="fixed" contentContainerStyle={themed($screenContainer)}>
      <Header title="Outlines" />

      <View style={themed($contentContainer)}>
        {outlines.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            <View style={themed($headerContainer)}>
              <TouchableOpacity style={themed($importIcon)} onPress={handleImportMarkdown}>
                <ListPlus size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={outlines}
              renderItem={renderOutlineItem}
              keyExtractor={(item) => item.id}
              style={themed($listContainer)}
              contentContainerStyle={themed($listContent)}
              refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
              }
              showsVerticalScrollIndicator={false}
            />
          </>
        )}
      </View>
    </Screen>
  )
}

// Styles
const $screenContainer: ViewStyle = {
  flex: 1,
}

const $contentContainer: ViewStyle = {
  flex: 1,
  paddingHorizontal: spacing.md,
}

const $loadingContainer: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
}

const $headerContainer: ViewStyle = {
  flexDirection: "row",
  justifyContent: "flex-end",
  alignItems: "center",
  paddingVertical: spacing.md,
}

const $importIcon: ViewStyle = {
  paddingLeft: spacing.md,
}

const $listContainer: ViewStyle = {
  flex: 1,
}

const $listContent: ViewStyle = {
  paddingBottom: spacing.lg,
}

// Neo-brutalist list item styling
const $itemWrapper: ViewStyle = {
  marginBottom: spacing.sm,
}

const $listItemContainerNeo: ViewStyle = {
  // Remove default separators & alignment from ListItem container wrapper; we style inner touchable instead
}

const $touchableNeo: ViewStyle = {
  backgroundColor: "#FFFFFF",
  borderWidth: 3,
  borderColor: "#162033",
  borderRadius: 14,
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
  shadowColor: "#0D1624",
  shadowOffset: { width: 6, height: 6 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 6,
  alignItems: "center",
}

const $badge: ViewStyle = {
  marginLeft: spacing.sm,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xxs,
  borderWidth: 2,
  borderColor: "#162033",
  backgroundColor: "#FFCFA8",
  borderRadius: 8,
  shadowColor: "#0D1624",
  shadowOffset: { width: 3, height: 3 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 3,
  justifyContent: "center",
  alignItems: "center",
  minHeight: 28,
}

const $badgeText: TextStyle = {
  fontWeight: "600",
  letterSpacing: 0.5,
  textTransform: "uppercase",
}

const $swipeActionsContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: spacing.sm,
  backgroundColor: "transparent",
}

const $editIcon: ViewStyle = {
  marginRight: spacing.sm,
  minWidth: 70,
  minHeight: 56,
  justifyContent: "center",
  alignItems: "center",
  marginBottom: spacing.xs,
}

const $deleteIcon: ViewStyle = {
  minWidth: 80,
  minHeight: 56,
  justifyContent: "center",
  alignItems: "center",
  marginBottom: spacing.xs,
}
