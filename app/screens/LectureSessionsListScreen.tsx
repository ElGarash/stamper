import React, { FC, useCallback, useEffect, useState } from "react"
import { View, ViewStyle, FlatList } from "react-native"
import { useFocusEffect } from "@react-navigation/native"

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

  const load = useCallback(() => {
    setSessions(getSessionsForOutline(outlineId))
  }, [outlineId])

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
        )}
      </View>
    </Screen>
  )
}

const $content: ViewStyle = {
  padding: spacing.md,
}
