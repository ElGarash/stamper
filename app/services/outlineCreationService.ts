/**
 * Outline Creation Service
 *
 * Handles the creation and persistence of Outline objects from markdown content.
 * This service combines markdown parsing with outline storage.
 */

import { Outline } from "@/models/Outline"

import { importFromText, ImportOptions } from "./markdownImportService"
import { addOutline } from "./outlineStorage"

export interface OutlineCreationResult {
  success: boolean
  outline?: Outline
  errors: string[]
  alreadyExists?: boolean
}

export interface CreateOutlineOptions extends ImportOptions {
  /**
   * Whether to overwrite an outline if one with the same title already exists
   */
  allowDuplicateTitles?: boolean
  /**
   * Whether to persist the outline to storage immediately
   */
  saveToStorage?: boolean
}

/**
 * Creates an outline from markdown content and optionally persists it
 */
export function createOutlineFromMarkdown(
  markdownContent: string,
  options: CreateOutlineOptions = {},
): OutlineCreationResult {
  const { allowDuplicateTitles = false, saveToStorage = true, ...importOptions } = options

  try {
    // Import and parse the markdown
    const importResult = importFromText(markdownContent, importOptions)

    if (!importResult.success || !importResult.outline) {
      return {
        success: false,
        errors: importResult.errors,
      }
    }

    const outline = importResult.outline

    // Check for duplicate titles if not allowed
    if (!allowDuplicateTitles && saveToStorage) {
      const existingOutlines = require("./outlineStorage").loadOutlines()
      const duplicateExists = existingOutlines.some(
        (existing: Outline) => existing.title === outline.title,
      )

      if (duplicateExists) {
        return {
          success: false,
          outline,
          errors: [`An outline with the title "${outline.title}" already exists`],
          alreadyExists: true,
        }
      }
    }

    // Save to storage if requested
    if (saveToStorage) {
      const saveSuccess = addOutline(outline)
      if (!saveSuccess) {
        return {
          success: false,
          outline,
          errors: ["Failed to save outline to storage"],
        }
      }
    }

    return {
      success: true,
      outline,
      errors: [],
    }
  } catch (error) {
    return {
      success: false,
      errors: [
        `Failed to create outline: ${error instanceof Error ? error.message : "Unknown error"}`,
      ],
    }
  }
}

/**
 * Creates an outline from markdown content with automatic title generation
 */
export function createOutlineFromMarkdownWithAutoTitle(
  markdownContent: string,
  baseTitle: string = "Imported Outline",
  options: Omit<CreateOutlineOptions, "customTitle"> = {},
): OutlineCreationResult {
  const { loadOutlines } = require("./outlineStorage")

  try {
    let finalTitle = baseTitle
    let counter = 1

    // Generate a unique title if duplicates are not allowed
    if (!options.allowDuplicateTitles && options.saveToStorage !== false) {
      const existingOutlines = loadOutlines()
      const existingTitles = existingOutlines.map((outline: Outline) => outline.title)

      while (existingTitles.includes(finalTitle)) {
        finalTitle = `${baseTitle} (${counter})`
        counter++
      }
    }

    return createOutlineFromMarkdown(markdownContent, {
      ...options,
      customTitle: finalTitle,
    })
  } catch (error) {
    return {
      success: false,
      errors: [
        `Failed to create outline with auto title: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      ],
    }
  }
}

/**
 * Creates multiple outlines from an array of markdown content
 */
export function createOutlinesFromMarkdownBatch(
  markdownContents: Array<{ content: string; title?: string }>,
  options: CreateOutlineOptions = {},
): {
  success: boolean
  results: OutlineCreationResult[]
  successCount: number
  failureCount: number
} {
  const results: OutlineCreationResult[] = []
  let successCount = 0
  let failureCount = 0

  for (const { content, title } of markdownContents) {
    const result = createOutlineFromMarkdown(content, {
      ...options,
      customTitle: title,
    })

    results.push(result)

    if (result.success) {
      successCount++
    } else {
      failureCount++
    }
  }

  return {
    success: successCount > 0,
    results,
    successCount,
    failureCount,
  }
}

/**
 * Validates markdown content before creating an outline
 */
export function validateMarkdownForOutlineCreation(markdownContent: string): {
  isValid: boolean
  errors: string[]
  warnings: string[]
  previewTitle?: string
  itemCount?: number
} {
  try {
    const { previewMarkdown } = require("./markdownImportService")
    const preview = previewMarkdown(markdownContent)

    const warnings: string[] = []

    // Check for common issues
    if (preview.previewOutline?.items.length === 0) {
      warnings.push("No list items found in the markdown content")
    }

    if (preview.previewOutline && preview.previewOutline.items.length > 50) {
      warnings.push("Large number of items detected - consider splitting into smaller outlines")
    }

    if (!preview.previewOutline?.title || preview.previewOutline.title === "Imported Outline") {
      warnings.push("No title detected - a default title will be used")
    }

    return {
      isValid: preview.isValid,
      errors: preview.errors,
      warnings,
      previewTitle: preview.previewOutline?.title,
      itemCount: preview.previewOutline?.items.length,
    }
  } catch (error) {
    return {
      isValid: false,
      errors: [`Validation failed: ${error instanceof Error ? error.message : "Unknown error"}`],
      warnings: [],
    }
  }
}
