// NotionImportScreen.tsx
// Screen to browse and import Notion pages tagged as lecture outlines

import { useState, useEffect } from "react"
import { View, ActivityIndicator, StyleSheet } from "react-native"

import { Button } from "../../components/Button"
import { Text } from "../../components/Text"
import { NotionService, NotionPage } from "../../services/api/NotionService"
import { colors } from "../../theme/colors"

export function NotionImportScreen() {
  const [loading, setLoading] = useState(false)
  const [pages, setPages] = useState<NotionPage[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPages() {
      setLoading(true)
      setError(null)
      try {
        // TODO: Replace with actual tag for lecture outlines
        const notionService = NotionService.getInstance()
        const fetchedPages = await notionService.fetchPages("lecture-outline")
        setPages(fetchedPages)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchPages()
  }, [])

  return (
    <View style={styles.container}>
      <Text>Import Notion Lecture Outlines</Text>
      {loading ? (
        <ActivityIndicator />
      ) : pages.length > 0 ? (
        pages.map((page) => (
          <View key={page.id} style={styles.pageItem}>
            <Text>{page.title}</Text>
            <Button
              text="Import"
              onPress={() => {
                /* TODO: handle import */
              }}
            />
          </View>
        ))
      ) : (
        <Text>No pages found.</Text>
      )}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  error: {
    color: colors.error,
    marginTop: 16,
  },
  pageItem: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 8,
    padding: 12,
    width: "100%",
  },
})
