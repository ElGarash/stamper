import { useState } from "react"
import { View, ActivityIndicator, StyleSheet } from "react-native"

import { Button } from "../../components/Button"
import { Text } from "../../components/Text"
import { NotionService } from "../../services/api/NotionService"

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  error: {
    color: "red",
  },
})

export function NotionOAuthScreen() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

  const handleOAuth = async () => {
    setLoading(true)
    setError(null)
    try {
      // TODO: Implement OAuth2 flow (open browser, get code, exchange for token)
      // For now, simulate with placeholder
      const code = "demo_code"
      const notionService = NotionService.getInstance()
      const authToken = await notionService.authenticateWithOAuth(code)
      setToken(authToken.access_token)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text>Connect your Notion account</Text>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Button text="Authenticate with Notion" onPress={handleOAuth} />
      )}
      {token && <Text>Authenticated! Token: {token}</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}