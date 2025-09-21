// Outline model
export interface Outline {
  id: string // UUID
  title: string
  items: Array<{ id: string; title: string; coveredAt?: number }>
}

// Lecture session model
export interface LectureSession {
  id: string
  outlineId: string
  startedAt: number
  pausedIntervals: Array<{ start: number; end: number }>
  itemTimestamps: Array<{ itemId: string; timestamp: number }>
  completedAt?: number
}

// Utility to parse Notion blocks into Outline items
export function parseNotionBulletsToOutlineItems(
  blocks: any[],
): Array<{ id: string; title: string }> {
  // Assumes blocks is an array of Notion block objects
  return blocks
    .filter((block) => block.type === "bulleted_list_item" && block.bulleted_list_item?.text)
    .map((block) => ({
      id: block.id,
      title: block.bulleted_list_item.text.map((t: any) => t.plain_text).join(""),
    }))
}

// Utility to generate a UUID for Outline id
export function generateOutlineId(): string {
  // Simple UUID v4 generator
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
