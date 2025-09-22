import { FC, useCallback, useEffect, useState } from "react"
import { FlatList, View, ViewStyle, TextStyle, Alert } from "react-native"

import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { Header } from "@/components/Header"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Outline } from "@/models/Outline"
import type { AppStackScreenProps } from "@/navigators/AppNavigator"
import { loadOutlines } from "@/services/outlineStorage"
import { spacing } from "@/theme/spacing"

interface OutlinePreviewScreenProps extends AppStackScreenProps<"OutlinePreview"> {}

export const OutlinePreviewScreen: FC<OutlinePreviewScreenProps> = (props) => {
  const { route, navigation } = props
  const { outlineId } = route.params
  const [outline, setOutline] = useState<Outline | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadOutline = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const outlines = await loadOutlines()
      const foundOutline = outlines.find((o) => o.id === outlineId)

      if (!foundOutline) {
        setError("Outline not found")
        return
      }

      setOutline(foundOutline)
    } catch (err) {
      console.error("Error loading outline:", err)
      setError("Failed to load outline")
    } finally {
      setLoading(false)
    }
  }, [outlineId])

  useEffect(() => {
    loadOutline()
  }, [loadOutline])

  const handleStartLecture = useCallback(() => {
    if (!outline) return

    // Navigate directly to lecture recording screen
    navigation.navigate("LectureRecording", { outline })
  }, [outline, navigation])

  const handleEdit = useCallback(() => {
    if (!outline) return

    // TODO: Navigate to edit screen
    Alert.alert("Coming Soon", "Edit functionality will be implemented next!")
  }, [outline])

  const renderOutlineItem = useCallback(
    ({ item, index }: { item: { id: string; title: string }; index: number }) => (
      <View style={$outlineItem}>
        <View style={$itemNumberContainer}>
          <Text style={$itemNumber}>{index + 1}</Text>
        </View>
        <Text style={$outlineItemText}>{item.title}</Text>
      </View>
    ),
    [],
  )

  if (loading) {
    return (
      <Screen style={$root} preset="scroll">
        <Header
          title="Loading..."
          leftIcon="back"
          onLeftPress={() => navigation.goBack()}
          style={$headerContainer}
        />
        <View style={$loadingContainer}>
          <Text>Loading outline...</Text>
        </View>
      </Screen>
    )
  }

  if (error || !outline) {
    return (
      <Screen style={$root} preset="scroll">
        <Header
          title="Error"
          leftIcon="back"
          onLeftPress={() => navigation.goBack()}
          style={$headerContainer}
        />
        <View style={$errorContainer}>
          <Text preset="subheading" text={error || "Outline not found"} />
          <Button
            text="Go Back"
            onPress={() => navigation.goBack()}
            style={{ marginTop: spacing.md }}
          />
        </View>
      </Screen>
    )
  }

  return (
    <Screen style={$root} preset="scroll">
      <Header
        title={outline.title}
        leftIcon="back"
        onLeftPress={() => navigation.goBack()}
        style={$headerContainer}
      />

      <View style={$contentContainer}>
        {/* Summary Card */}

        {/* Action Buttons */}
        <View style={$actionButtonsContainer}>
          <Button text="🎤 Start Lecture" onPress={handleStartLecture} style={$startButton} />
          <Button text="✏️ Edit" preset="reversed" onPress={handleEdit} style={$editButton} />
        </View>

        {/* Outline Content */}
        <Card
          style={$itemsCard}
          ContentComponent={
            <View>
              <Text preset="subheading" text="Outline Topics" style={$cardTitle} />
              <FlatList
                data={outline.items}
                renderItem={renderOutlineItem}
                keyExtractor={(item) => item.id}
                style={$itemsList}
                scrollEnabled={false}
              />
            </View>
          }
        />
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

const $loadingContainer: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
}

const $errorContainer: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  padding: spacing.lg,
}

const $contentContainer: ViewStyle = {
  padding: spacing.md,
}

const $itemsCard: ViewStyle = {
  marginBottom: spacing.xl,
}

const $cardTitle: ViewStyle = {
  marginBottom: spacing.sm,
}

const $actionButtonsContainer: ViewStyle = {
  flexDirection: "row",
  gap: spacing.sm,
  marginBottom: spacing.md,
}

const $startButton: ViewStyle = {
  flex: 1,
}

const $editButton: ViewStyle = {
  flex: 1,
}

const $itemsList: ViewStyle = {
  marginTop: spacing.xs,
}

const $outlineItem: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
  marginVertical: spacing.xs,
  backgroundColor: "#f5f5f5",
  borderRadius: spacing.sm,
  borderLeftWidth: 4,
  borderLeftColor: "#007AFF",
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

const $outlineItemText: TextStyle = {
  flex: 1,
  fontSize: 16,
  color: "#333333",
}
