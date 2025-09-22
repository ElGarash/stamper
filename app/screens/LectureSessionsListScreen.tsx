import { FC, useCallback, useState } from "react"
import { View, ViewStyle, FlatList } from "react-native"
import { useFocusEffect } from "@react-navigation/native"

import { Button } from "@/components/Button"
import { Header } from "@/components/Header"
import { ListItem } from "@/components/ListItem"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackScreenProps } from "@/navigators/AppNavigator"
import { getSessionsForOutline } from "@/services/lectureSessionStorage"
import { spacing } from "@/theme/spacing"

type Props = AppStackScreenProps<"LectureSessionsList">

export const LectureSessionsListScreen: FC<Props> = ({ route, navigation }) => {
  const { outlineId } = route.params
  const [sessions, setSessions] = useState<any[]>([])
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")

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

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load]),
  )

  return (
    <Screen preset="fixed">
      <Header title="Recorded Sessions" leftIcon="back" onLeftPress={() => navigation.goBack()} />

      <View style={$content}>
        {sessions.length === 0 ? (
          <Text>No recorded sessions for this outline</Text>
        ) : (
          <>
            <Button
              text={`Sort: ${sortOrder === "newest" ? "Oldest First" : "Newest First"}`}
              onPress={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
              style={{ marginBottom: spacing.md }}
            />
            <FlatList
              data={sessions}
              keyExtractor={(s) => s.id}
              renderItem={({ item }) => (
                <ListItem
                  text={new Date(item.startedAt).toLocaleString()}
                  onPress={() => navigation.navigate("LectureSession", { sessionId: item.id })}
                  bottomSeparator
                  RightComponent={<Text size="xs">{item.itemTimestamps.length} marks</Text>}
                />
              )}
            />
          </>
        )}
      </View>
    </Screen>
  )
}

const $content: ViewStyle = {
  padding: spacing.md,
}
