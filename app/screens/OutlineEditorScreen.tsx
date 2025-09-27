import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Alert, View, ViewStyle, TextStyle, TouchableOpacity } from "react-native"
import { GripVertical, Plus, Trash } from "lucide-react-native"
import DraggableFlatList, { ScaleDecorator } from "react-native-draggable-flatlist"
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable"

import { Header } from "@/components/Header"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { Outline, generateOutlineId } from "@/models/Outline"
import type { AppStackScreenProps } from "@/navigators/AppNavigator"
import { getOutlineById, updateOutline } from "@/services/outlineStorage"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"

interface OutlineEditorScreenProps extends AppStackScreenProps<"OutlineEditor"> {}

export const OutlineEditorScreen: FC<OutlineEditorScreenProps> = (props) => {
  const { route, navigation } = props
  const { outlineId } = route.params
  const { themed } = useAppTheme()

  const [outline, setOutline] = useState<Outline | null>(null)
  const [title, setTitle] = useState("")
  const [items, setItems] = useState<Outline["items"]>([])
  const [loading, setLoading] = useState(true)
  const [dirty, setDirty] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [newItemTitle, setNewItemTitle] = useState("")
  const addInputRef = useRef<any>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")

  useEffect(() => {
    const current = getOutlineById(outlineId)
    if (current) {
      setOutline(current)
      setTitle(current.title)
      setItems(current.items)
    }
    setLoading(false)
  }, [outlineId])

  useEffect(() => {
    if (isAdding) {
      const id = setTimeout(() => addInputRef.current?.focus(), 0)
      return () => clearTimeout(id)
    }
    return undefined
  }, [isAdding])

  const isDirty = useMemo(() => {
    if (!outline) return false
    if (dirty) return true
    if (title.trim() !== outline.title.trim()) return true
    // Compare length, order and content
    if (items.length !== outline.items.length) return true
    for (let i = 0; i < items.length; i++) {
      const a = items[i]
      const b = outline.items[i]
      if (a.id !== b.id) return true
      if (a.title.trim() !== b.title.trim()) return true
    }
    return false
  }, [outline, title, items, dirty])

  const handleSave = useCallback(() => {
    if (!outline) return
    const newTitle = title.trim()
    if (!newTitle) {
      Alert.alert("Title required", "Please enter a title for the outline.")
      return
    }
    const updated: Outline = { ...outline, title: newTitle, items }
    const ok = updateOutline(updated)
    if (!ok) {
      Alert.alert("Save failed", "Could not save changes. Please try again.")
      return
    }
    setOutline(updated)
    setDirty(false)
    navigation.goBack()
  }, [outline, title, items, navigation])

  const handleBack = useCallback(() => {
    if (isDirty) {
      Alert.alert("Discard changes?", "You have unsaved changes.", [
        { text: "Cancel", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: () => navigation.goBack() },
      ])
      return
    }
    navigation.goBack()
  }, [isDirty, navigation])

  const addNewItem = useCallback(() => {
    const t = newItemTitle.trim()
    if (!t) return
    const newItem = { id: generateOutlineId(), title: t }
    setItems((prev) => [...prev, newItem])
    setNewItemTitle("")
    setDirty(true)
    setIsAdding(false)
  }, [newItemTitle])

  const startEditItem = useCallback(
    (itemId: string) => {
      const it = items.find((i) => i.id === itemId)
      if (!it) return
      setEditingItemId(itemId)
      setEditingTitle(it.title)
    },
    [items],
  )

  const commitEditItem = useCallback(() => {
    if (!editingItemId) return
    const t = editingTitle.trim()
    if (!t) {
      Alert.alert("Title required", "Please enter a title for the item.")
      return
    }
    setItems((prev) => prev.map((i) => (i.id === editingItemId ? { ...i, title: t } : i)))
    setEditingItemId(null)
    setEditingTitle("")
    setDirty(true)
  }, [editingItemId, editingTitle])

  const cancelEditItem = useCallback(() => {
    setEditingItemId(null)
    setEditingTitle("")
  }, [])

  const deleteItem = useCallback(
    (itemId: string) => {
      const it = items.find((i) => i.id === itemId)
      const title = it?.title ?? "this item"
      Alert.alert("Delete Item", `Are you sure you want to delete "${title}"?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setItems((prev) => prev.filter((i) => i.id !== itemId))
            setDirty(true)
            if (editingItemId === itemId) cancelEditItem()
          },
        },
      ])
    },
    [items, editingItemId, cancelEditItem],
  )

  if (loading) {
    return (
      <Screen preset="fixed" contentContainerStyle={themed($container)}>
        <Header title="Editing" leftIcon="back" onLeftPress={handleBack} />
        <View style={themed($content)}>
          <Text>Loading...</Text>
        </View>
      </Screen>
    )
  }

  if (!outline) {
    return (
      <Screen preset="fixed" contentContainerStyle={themed($container)}>
        <Header title="Not Found" leftIcon="back" onLeftPress={() => navigation.goBack()} />
        <View style={themed($content)}>
          <Text>Outline not found.</Text>
        </View>
      </Screen>
    )
  }

  return (
    <Screen preset="fixed" contentContainerStyle={themed($container)}>
      <Header
        title="Edit Outline"
        leftIcon="back"
        onLeftPress={handleBack}
        rightText={isDirty ? "Save" : undefined}
        onRightPress={isDirty ? handleSave : undefined}
      />

      <View style={themed($content)}>
        <Text preset="subheading" text="Title" style={themed($sectionLabel)} />
        <TextField
          value={title}
          onChangeText={(t) => {
            setTitle(t)
          }}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleSave}
          placeholder="Outline title"
          inputWrapperStyle={themed($inputWrapper)}
          style={themed($titleInput)}
        />

        <View style={themed($itemsSection)}>
          <Text preset="subheading" text="Topics" style={themed($sectionLabel)} />
          <DraggableFlatList
            data={items}
            keyExtractor={(item) => item.id}
            onDragEnd={({ data }) => {
              setItems(data)
              setDirty(true)
            }}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="on-drag"
            activationDistance={12}
            containerStyle={themed($listContainer)}
            contentContainerStyle={themed($listContent)}
            scrollEnabled={!isAdding}
            dragItemOverflow={false}
            extraData={{ editingItemId, editingTitle }}
            renderItem={({ item, drag, isActive, getIndex }) => {
              const indexLabel = typeof getIndex === "function" ? `${(getIndex() ?? 0) + 1}. ` : ""
              const isEditing = editingItemId === item.id
              return (
                <ScaleDecorator activeScale={1.01}>
                  <ReanimatedSwipeable
                    overshootRight={false}
                    renderRightActions={() => (
                      <View style={themed($swipeActionsContainer)}>
                        <TouchableOpacity
                          style={themed($deleteIcon)}
                          onPress={() => deleteItem(item.id)}
                        >
                          <Trash size={22} color="#ff3b30" />
                        </TouchableOpacity>
                      </View>
                    )}
                  >
                    <View style={[themed($row), isActive ? themed($rowActive) : null]}>
                      <TouchableOpacity
                        onLongPress={isEditing ? undefined : drag}
                        disabled={isActive || isEditing}
                        style={themed($handle)}
                      >
                        <GripVertical size={20} />
                      </TouchableOpacity>
                      {isEditing ? (
                        (() => {
                          const RNTextInput = require("react-native")
                            .TextInput as typeof import("react-native").TextInput
                          return (
                            <RNTextInput
                              value={editingTitle}
                              onChangeText={setEditingTitle}
                              autoFocus
                              placeholder="Edit item title"
                              returnKeyType="done"
                              onSubmitEditing={commitEditItem}
                              onBlur={cancelEditItem}
                              style={themed($rowNativeInput)}
                            />
                          )
                        })()
                      ) : (
                        <TouchableOpacity
                          style={themed($rowTextPressable)}
                          delayLongPress={200}
                          onLongPress={() => startEditItem(item.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={themed($rowText)} numberOfLines={2}>
                            {indexLabel}
                            {item.title}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </ReanimatedSwipeable>
                </ScaleDecorator>
              )
            }}
          />

          {/* Add Item Row placed below list for better input behavior */}
          {!isAdding ? (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setIsAdding(true)}
              style={themed([$row, $addRow])}
            >
              <View style={themed($handle)}>
                <Plus size={20} />
              </View>
              <Text style={themed($addText)}>{(items.length + 1).toString()}. Add item</Text>
            </TouchableOpacity>
          ) : (
            <View style={themed([$row, $addRow])}>
              <View style={themed($handle)}>
                <Plus size={20} />
              </View>
              {/** Use native TextInput to avoid gesture conflicts */}
              {(() => {
                const RNTextInput = require("react-native")
                  .TextInput as typeof import("react-native").TextInput
                return (
                  <RNTextInput
                    ref={addInputRef}
                    value={newItemTitle}
                    onChangeText={setNewItemTitle}
                    placeholder="New item title"
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={addNewItem}
                    blurOnSubmit={false}
                    autoCorrect={false}
                    autoCapitalize="none"
                    onBlur={() => {
                      if (!newItemTitle.trim()) setIsAdding(false)
                    }}
                    style={themed($rowNativeInput)}
                  />
                )
              })()}
            </View>
          )}
        </View>
      </View>
    </Screen>
  )
}

const $container: ViewStyle = {
  flex: 1,
  justifyContent: "flex-start",
}

const $content: ViewStyle = {
  padding: spacing.md,
}

const $sectionLabel: ViewStyle = {
  marginBottom: spacing.xs,
}

const $inputWrapper: ViewStyle = {
  // Spacious for title editing
}

const $titleInput: import("react-native").TextStyle = {
  fontSize: 20,
}

const $itemsSection: ViewStyle = {
  marginTop: spacing.lg,
}

const $listContainer: ViewStyle = {
  // let list size to content; editor screen is not scroll preset, so keep lightweight
}

const $listContent: ViewStyle = {
  paddingBottom: 0,
}

const $row: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.sm,
  borderRadius: 12,
  backgroundColor: "#FFFFFF",
  borderWidth: 3,
  borderColor: "#162033",
  shadowColor: "#0D1624",
  shadowOffset: { width: 4, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 4,
  marginBottom: spacing.xs,
}

const $rowActive: ViewStyle = {
  backgroundColor: "#FFE8D6",
}

const $handle: ViewStyle = {
  width: 32,
  alignItems: "center",
  justifyContent: "center",
  marginRight: spacing.sm,
}

const $rowText: TextStyle = {
  flex: 1,
  fontSize: 16,
  fontWeight: "500",
  color: "#273041",
}

const $addText: TextStyle = {
  flex: 1,
  fontSize: 16,
  opacity: 0.8,
  color: "#273041",
}

const $rowNativeInput: TextStyle = {
  flex: 1,
  fontSize: 16,
  paddingVertical: 8,
  color: "#273041",
}

const $rowTextPressable: ViewStyle = {
  flex: 1,
}

const $addRow: ViewStyle = {
  marginTop: spacing.xs,
}

const $swipeActionsContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: spacing.sm,
}

const $deleteIcon: ViewStyle = {
  minWidth: 64,
  minHeight: 48,
  justifyContent: "center",
  alignItems: "center",
}
