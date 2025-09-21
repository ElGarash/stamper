/**
 * Markdown List Parser Utilities
 *
 * Parses various markdown list formats into structured data for the Outline model:
 * - Bullet lists: `- item`, `* item`
 * - Todo lists: `- [ ] item`, `- [x] item`
 * - Nested lists with proper indentation support
 */

export interface ParsedMarkdownItem {
  id: string
  title: string
  completed?: boolean
  level: number
  children?: ParsedMarkdownItem[]
}

export interface MarkdownParseResult {
  items: ParsedMarkdownItem[]
  title?: string
  errors: string[]
}

/**
 * Generates a unique ID for markdown items
 */
function generateId(): string {
  return `md_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Detects the indentation level of a line
 */
function getIndentationLevel(line: string): number {
  const match = line.match(/^(\s*)/)
  if (!match) return 0

  const spaces = match[1]
  // Treat 2 spaces or 1 tab as one level
  return Math.floor(spaces.replace(/\t/g, "  ").length / 2)
}

/**
 * Parses a single markdown list item line
 */
function parseMarkdownLine(
  line: string,
  lineNumber: number,
): {
  item: ParsedMarkdownItem | null
  error?: string
} {
  const trimmedLine = line.trim()

  // Skip empty lines
  if (!trimmedLine) {
    return { item: null }
  }

  const level = getIndentationLevel(line)

  // Match todo lists first: - [ ] item or - [x] item
  const todoMatch = trimmedLine.match(/^-\s*\[([x\s])\]\s+(.+)$/)
  if (todoMatch) {
    const completed = todoMatch[1].toLowerCase() === "x"
    return {
      item: {
        id: generateId(),
        title: todoMatch[2].trim(),
        completed,
        level,
        children: [],
      },
    }
  }

  // Match bullet lists: - item or * item
  const bulletMatch = trimmedLine.match(/^[-*]\s+(.+)$/)
  if (bulletMatch) {
    return {
      item: {
        id: generateId(),
        title: bulletMatch[1].trim(),
        level,
        children: [],
      },
    }
  }

  // Check if it's a potential title (no list marker)
  if (!trimmedLine.startsWith("-") && !trimmedLine.startsWith("*") && level === 0) {
    // This might be a title, but we'll handle it in the main parser
    return { item: null }
  }

  // If it starts with a list marker but doesn't match our patterns, it's an error
  if (trimmedLine.startsWith("-") || trimmedLine.startsWith("*")) {
    return {
      item: null,
      error: `Line ${lineNumber + 1}: Invalid list format: "${trimmedLine}"`,
    }
  }

  return { item: null }
}

/**
 * Builds a nested structure from flat list items based on indentation levels
 */
function buildNestedStructure(flatItems: ParsedMarkdownItem[]): ParsedMarkdownItem[] {
  const result: ParsedMarkdownItem[] = []
  const stack: ParsedMarkdownItem[] = []

  for (const item of flatItems) {
    // Find the correct parent by looking up the stack
    while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
      stack.pop()
    }

    if (stack.length === 0) {
      // Top-level item
      result.push(item)
    } else {
      // Child item
      const parent = stack[stack.length - 1]
      if (!parent.children) {
        parent.children = []
      }
      parent.children.push(item)
    }

    stack.push(item)
  }

  return result
}

/**
 * Extracts a potential title from the markdown content
 */
function extractTitle(lines: string[]): string | undefined {
  // Look for the first non-empty line that's not a list item
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Check if it's a markdown heading
    const headingMatch = trimmed.match(/^#+\s*(.+)$/)
    if (headingMatch) {
      return headingMatch[1].trim()
    }

    // If it's not a list item and not empty, consider it a title
    if (!trimmed.match(/^[-*]\s/) && !trimmed.match(/^-\s*\[/)) {
      return trimmed
    }

    // If we hit a list item, stop looking for title
    break
  }

  return undefined
}

/**
 * Main function to parse markdown list content
 */
export function parseMarkdownList(content: string): MarkdownParseResult {
  const lines = content.split("\n")
  const errors: string[] = []
  const flatItems: ParsedMarkdownItem[] = []

  // Extract potential title
  const title = extractTitle(lines)

  // Parse each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const parseResult = parseMarkdownLine(line, i)

    if (parseResult.error) {
      errors.push(parseResult.error)
    }

    if (parseResult.item) {
      flatItems.push(parseResult.item)
    }
  }

  // Build nested structure
  const nestedItems = buildNestedStructure(flatItems)

  return {
    items: nestedItems,
    title,
    errors,
  }
}

/**
 * Validates that parsed markdown items are suitable for conversion to Outline
 */
export function validateMarkdownItems(items: ParsedMarkdownItem[]): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (items.length === 0) {
    errors.push("No valid list items found")
  }

  // Check for items with empty titles
  function validateItemsRecursively(itemList: ParsedMarkdownItem[]) {
    for (const item of itemList) {
      if (!item.title || item.title.trim() === "") {
        errors.push(`Item with ID ${item.id} has empty title`)
      }

      if (item.children && item.children.length > 0) {
        validateItemsRecursively(item.children)
      }
    }
  }

  validateItemsRecursively(items)

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Flattens nested markdown items into a simple array for Outline model
 */
export function flattenMarkdownItems(
  items: ParsedMarkdownItem[],
): Array<{ id: string; title: string }> {
  const result: Array<{ id: string; title: string }> = []

  function flattenRecursively(itemList: ParsedMarkdownItem[], prefix = "") {
    for (const item of itemList) {
      // Add indentation prefix for nested items
      const title = prefix + item.title
      result.push({
        id: item.id,
        title,
      })

      if (item.children && item.children.length > 0) {
        flattenRecursively(item.children, prefix + "  ")
      }
    }
  }

  flattenRecursively(items)
  return result
}

/**
 * Converts parsed markdown items to Outline-compatible format
 */
export function convertToOutlineFormat(
  parseResult: MarkdownParseResult,
  customTitle?: string,
): {
  title: string
  items: Array<{ id: string; title: string }>
} {
  const title = customTitle || parseResult.title || "Imported Outline"
  const items = flattenMarkdownItems(parseResult.items)

  return {
    title,
    items,
  }
}
