/**
 * Markdown Import Service
 *
 * Coordinates file importing, clipboard access, and markdown parsing
 * to create Outline objects from various markdown sources.
 */

import Clipboard from "@react-native-clipboard/clipboard"
import { pick, DocumentPickerResponse } from "@react-native-documents/picker"

import { Outline, generateOutlineId } from "../models/Outline"
import {
  parseMarkdownList,
  validateMarkdownItems,
  convertToOutlineFormat,
  MarkdownParseResult,
} from "../utils/markdownParser"

export interface ImportResult {
  success: boolean
  outline?: Outline
  errors: string[]
  parseResult?: MarkdownParseResult
}

export interface ImportOptions {
  customTitle?: string
  validateItems?: boolean
}

/**
 * Import markdown content from a file using the document picker
 */
export async function importFromFile(options: ImportOptions = {}): Promise<ImportResult> {
  try {
    const result = await pick({
      type: ["text/plain", "text/markdown", "application/octet-stream"],
      allowMultiSelection: false,
    })

    if (!result || result.length === 0) {
      return {
        success: false,
        errors: ["No file selected"],
      }
    }

    const file = result[0] as DocumentPickerResponse

    // Read file content (this is a simplified approach - in a real app you'd want to handle this more robustly)
    const response = await fetch(file.uri)
    const content = await response.text()

    return importFromText(content, {
      ...options,
      customTitle: options.customTitle || file.name || undefined,
    })
  } catch (error) {
    return {
      success: false,
      errors: [`File import failed: ${error instanceof Error ? error.message : "Unknown error"}`],
    }
  }
}

/**
 * Import markdown content from the clipboard
 */
export async function importFromClipboard(options: ImportOptions = {}): Promise<ImportResult> {
  try {
    const content = await Clipboard.getString()

    if (!content || content.trim() === "") {
      return {
        success: false,
        errors: ["Clipboard is empty"],
      }
    }

    return importFromText(content, {
      ...options,
      customTitle: options.customTitle || "Clipboard Import",
    })
  } catch (error) {
    return {
      success: false,
      errors: [
        `Clipboard import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      ],
    }
  }
}

/**
 * Import markdown content from raw text
 */
export function importFromText(content: string, options: ImportOptions = {}): ImportResult {
  try {
    // Parse the markdown content
    const parseResult = parseMarkdownList(content)

    // Check for parsing errors
    if (parseResult.errors.length > 0) {
      return {
        success: false,
        errors: parseResult.errors,
        parseResult,
      }
    }

    // Validate items if requested
    if (options.validateItems !== false) {
      const validation = validateMarkdownItems(parseResult.items)
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
          parseResult,
        }
      }
    }

    // Convert to outline format
    const outlineData = convertToOutlineFormat(parseResult, options.customTitle)

    // Create the Outline object
    const outline: Outline = {
      id: generateOutlineId(),
      title: outlineData.title,
      items: outlineData.items,
    }

    return {
      success: true,
      outline,
      errors: [],
      parseResult,
    }
  } catch (error) {
    return {
      success: false,
      errors: [`Text import failed: ${error instanceof Error ? error.message : "Unknown error"}`],
    }
  }
}

/**
 * Preview markdown content without creating an outline
 */
export function previewMarkdown(content: string): {
  isValid: boolean
  parseResult: MarkdownParseResult
  previewOutline?: { title: string; items: Array<{ id: string; title: string; notes?: string }> }
  errors: string[]
} {
  try {
    const parseResult = parseMarkdownList(content)
    const validation = validateMarkdownItems(parseResult.items)

    let previewOutline
    if (validation.isValid) {
      previewOutline = convertToOutlineFormat(parseResult)
    }

    return {
      isValid: validation.isValid && parseResult.errors.length === 0,
      parseResult,
      previewOutline,
      errors: [...parseResult.errors, ...validation.errors],
    }
  } catch (error) {
    return {
      isValid: false,
      parseResult: { items: [], errors: [] },
      errors: [`Preview failed: ${error instanceof Error ? error.message : "Unknown error"}`],
    }
  }
}

/**
 * Check if clipboard contains markdown content
 */
export async function hasMarkdownInClipboard(): Promise<boolean> {
  try {
    const content = await Clipboard.getString()
    if (!content || content.trim() === "") return false

    // Quick check for markdown list patterns
    const markdownPatterns = [
      /^[-*]\s+/m, // Bullet lists
      /^-\s*\[[x\s]\]\s+/m, // Todo lists
      /^#+\s+/m, // Headers
    ]

    return markdownPatterns.some((pattern) => pattern.test(content))
  } catch {
    return false
  }
}
