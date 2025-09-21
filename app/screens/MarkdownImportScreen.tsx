import { useCallback, useEffect, useState } from "react"
import { Alert, View, ScrollView, StyleSheet } from "react-native"

import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import type { AppStackScreenProps } from "@/navigators/AppNavigator"
import {
  importFromFile,
  importFromClipboard,
  importFromText,
  previewMarkdown,
  hasMarkdownInClipboard,
  ImportResult,
} from "@/services/markdownImportService"
import { addOutline } from "@/services/outlineStorage"
import { colors } from "@/theme/colors"
import { spacing } from "@/theme/spacing"

interface Props extends AppStackScreenProps<"MarkdownImport"> {}

type ImportMode = "file" | "clipboard" | "manual"

export const MarkdownImportScreen = ({ navigation }: Props) => {
  const [isLoading, setIsLoading] = useState(false)
  const [importMode, setImportMode] = useState<ImportMode | null>(null)
  const [manualText, setManualText] = useState("")
  const [previewData, setPreviewData] = useState<any>(null)
  const [hasClipboardContent, setHasClipboardContent] = useState(false)

  // Check for clipboard content on mount
  useEffect(() => {
    hasMarkdownInClipboard().then(setHasClipboardContent)
  }, [])

  const handleImportResult = useCallback(
    (result: ImportResult) => {
      if (result.success && result.outline) {
        console.log("📝 Import successful, saving outline:", result.outline.title)
        // Save the outline to storage
        const saved = addOutline(result.outline)
        console.log("💾 Outline save result:", saved)

        if (saved) {
          Alert.alert(
            "Import Successful",
            `Imported "${result.outline.title}" with ${result.outline.items.length} items.`,
            [
              {
                text: "OK",
                onPress: () => {
                  // Navigate to outline list to show the saved outline
                  navigation.navigate("OutlinesList")
                },
              },
            ],
          )
        } else {
          Alert.alert(
            "Save Failed",
            "The outline was imported but could not be saved to storage.",
            [{ text: "OK" }],
          )
        }
      } else {
        Alert.alert("Import Failed", result.errors.join("\n") || "Unknown error occurred.", [
          { text: "OK" },
        ])
      }
    },
    [navigation],
  )

  const handleFileImport = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await importFromFile()
      handleImportResult(result)
    } catch {
      Alert.alert("Error", "Failed to import file")
    } finally {
      setIsLoading(false)
    }
  }, [handleImportResult])

  const handleClipboardImport = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await importFromClipboard()
      handleImportResult(result)
    } catch {
      Alert.alert("Error", "Failed to import from clipboard")
    } finally {
      setIsLoading(false)
    }
  }, [handleImportResult])

  const handleManualImport = useCallback(async () => {
    if (!manualText.trim()) {
      Alert.alert("Error", "Please enter some text to import")
      return
    }

    setIsLoading(true)
    try {
      const result = importFromText(manualText)
      handleImportResult(result)
    } catch {
      Alert.alert("Error", "Failed to import text")
    } finally {
      setIsLoading(false)
    }
  }, [manualText, handleImportResult])

  const handlePreview = useCallback(() => {
    if (!manualText.trim()) {
      setPreviewData(null)
      return
    }

    const preview = previewMarkdown(manualText)
    setPreviewData(preview)
  }, [manualText])

  const renderImportModeSelection = () => (
    <View>
      <Text preset="heading" style={{ marginBottom: spacing.md }}>
        Choose Import Method
      </Text>

      <Card
        style={{ marginBottom: spacing.sm }}
        ContentComponent={
          <View>
            <Text preset="subheading">📁 Import from File</Text>
            <Text style={styles.descriptionText}>
              Select a markdown (.md) or text file from your device
            </Text>
          </View>
        }
        onPress={() => setImportMode("file")}
      />

      <Card
        style={hasClipboardContent ? styles.cardEnabled : styles.cardDisabled}
        ContentComponent={
          <View>
            <Text preset="subheading">📋 Import from Clipboard</Text>
            <Text style={styles.descriptionText}>
              {hasClipboardContent
                ? "Markdown content detected in clipboard"
                : "No markdown content found in clipboard"}
            </Text>
          </View>
        }
        onPress={hasClipboardContent ? () => setImportMode("clipboard") : undefined}
      />

      <Card
        ContentComponent={
          <View>
            <Text preset="subheading">✏️ Manual Entry</Text>
            <Text style={styles.descriptionText}>Type or paste markdown text directly</Text>
          </View>
        }
        onPress={() => setImportMode("manual")}
      />
    </View>
  )

  const renderFileImport = () => (
    <View>
      <Text preset="heading" style={styles.headingText}>
        Import from File
      </Text>
      <Text style={styles.fileDescriptionText}>
        Select a markdown or text file containing your outline
      </Text>

      <Button
        text="Choose File"
        onPress={handleFileImport}
        disabled={isLoading}
        style={{ marginBottom: spacing.md }}
      />

      <Button
        text="Back"
        preset="default"
        onPress={() => setImportMode(null)}
        disabled={isLoading}
      />
    </View>
  )

  const renderClipboardImport = () => (
    <View>
      <Text preset="heading" style={styles.headingText}>
        Import from Clipboard
      </Text>
      <Text style={styles.clipboardDescriptionText}>
        Import the markdown content currently in your clipboard
      </Text>

      <Button
        text="Import from Clipboard"
        onPress={handleClipboardImport}
        disabled={isLoading}
        style={{ marginBottom: spacing.md }}
      />

      <Button
        text="Back"
        preset="default"
        onPress={() => setImportMode(null)}
        disabled={isLoading}
      />
    </View>
  )

  const renderManualImport = () => (
    <View>
      <Text preset="heading" style={styles.headingText}>
        Manual Entry
      </Text>
      <Text style={styles.manualDescriptionText}>Type or paste your markdown list below:</Text>

      <TextField
        multiline
        numberOfLines={10}
        placeholder="Example:&#10;# My Lecture Outline&#10;- Introduction&#10;- Main Topic&#10;  - Subtopic 1&#10;  - Subtopic 2&#10;- Conclusion"
        value={manualText}
        onChangeText={setManualText}
        onBlur={handlePreview}
        containerStyle={{ marginBottom: spacing.md }}
      />

      {previewData && (
        <Card
          style={{ marginBottom: spacing.md }}
          ContentComponent={
            <View>
              <Text preset="subheading" style={{ marginBottom: spacing.xs }}>
                Preview
              </Text>
              {previewData.isValid ? (
                <View>
                  <Text style={styles.previewTitle}>
                    {previewData.previewOutline?.title || "Untitled Outline"}
                  </Text>
                  {previewData.previewOutline?.items.map((item: any, index: number) => (
                    <Text key={index} style={styles.itemText}>
                      • {item.title}
                    </Text>
                  ))}
                </View>
              ) : (
                <View>
                  <Text style={styles.errorText}>Invalid format</Text>
                  {previewData.errors.map((error: string, index: number) => (
                    <Text key={index} style={styles.errorTextSmall}>
                      {error}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          }
        />
      )}

      <Button
        text="Import"
        onPress={handleManualImport}
        disabled={isLoading || !manualText.trim() || (previewData && !previewData.isValid)}
        style={{ marginBottom: spacing.md }}
      />

      <Button
        text="Back"
        preset="default"
        onPress={() => {
          setImportMode(null)
          setManualText("")
          setPreviewData(null)
        }}
        disabled={isLoading}
      />
    </View>
  )

  const renderContent = () => {
    switch (importMode) {
      case "file":
        return renderFileImport()
      case "clipboard":
        return renderClipboardImport()
      case "manual":
        return renderManualImport()
      default:
        return renderImportModeSelection()
    }
  }

  return (
    <Screen preset="scroll" safeAreaEdges={["top"]}>
      <View style={{ padding: spacing.lg }}>
        <ScrollView showsVerticalScrollIndicator={false}>{renderContent()}</ScrollView>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  cardDisabled: {
    marginBottom: spacing.sm,
    opacity: 0.5,
  },
  cardEnabled: {
    marginBottom: spacing.sm,
  },
  clipboardDescriptionText: {
    color: colors.textDim,
    marginBottom: spacing.lg,
  },
  descriptionText: {
    color: colors.textDim,
    marginTop: spacing.xs,
  },
  errorText: {
    color: colors.error,
  },
  errorTextSmall: {
    color: colors.error,
    fontSize: 12,
  },
  fileDescriptionText: {
    color: colors.textDim,
    marginBottom: spacing.lg,
  },
  headingText: {
    marginBottom: spacing.md,
  },
  itemText: {
    marginLeft: spacing.xs,
  },
  manualDescriptionText: {
    color: colors.textDim,
    marginBottom: spacing.sm,
  },
  previewTitle: {
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
})
