import { FC, useCallback, useEffect, useState } from "react"
import { FlatList, View, ViewStyle, Alert, RefreshControl } from "react-native"

import { Button } from "@/components/Button"
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

interface OutlinesListScreenProps extends AppStackScreenProps<"OutlinesList"> {}

export const OutlinesListScreen: FC<OutlinesListScreenProps> = function OutlinesListScreen(props) {
  const { navigation } = props
  const { themed } = useAppTheme()

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

  const handleOutlinePress = useCallback(
    (outline: Outline) => {
      navigation.navigate("OutlinePreview", { outlineId: outline.id })
    },
    [navigation],
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
    <ListItem
      text={outline.title}
      bottomSeparator
      onPress={() => handleOutlinePress(outline)}
      RightComponent={
        <View style={themed($itemInfoContainer)}>
          <Text size="xs" style={themed($itemCount)}>
            {outline.items.length} items
          </Text>
        </View>
      }
      containerStyle={themed($itemContainer)}
      onLongPress={() => handleDeleteOutline(outline.id, outline.title)}
    />
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
              <Text preset="subheading" style={themed($headerText)}>
                {outlines.length} outline{outlines.length !== 1 ? "s" : ""}
              </Text>
              <Button
                text="Import"
                preset="default"
                style={themed($importButton)}
                onPress={handleImportMarkdown}
              />
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
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.xs,
}

const $headerText: ViewStyle = {
  flex: 1,
}

const $importButton: ViewStyle = {
  minWidth: 80,
  paddingHorizontal: spacing.md,
}

const $listContainer: ViewStyle = {
  flex: 1,
}

const $listContent: ViewStyle = {
  paddingBottom: spacing.lg,
}

const $itemContainer: ViewStyle = {
  alignItems: "center",
}

const $itemInfoContainer: ViewStyle = {
  alignItems: "center",
  justifyContent: "center",
  minHeight: 56, // Match the ListItem height
}

const $itemCount: ViewStyle = {
  opacity: 0.6,
}
