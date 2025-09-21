/**
 * Outline Storage Service
 *
 * Handles persistence of Outline objects to device storage using MMKV.
 * Provides CRUD operations for managing user outlines.
 */

import { Outline } from "@/models/Outline"
import { load, save } from "@/utils/storage"

const OUTLINES_STORAGE_KEY = "user_outlines"

/**
 * Load all outlines from storage
 */
export function loadOutlines(): Outline[] {
  try {
    console.log("🔍 Loading outlines from storage key:", OUTLINES_STORAGE_KEY)
    const outlines = load<Outline[]>(OUTLINES_STORAGE_KEY)
    console.log("📦 Raw data from storage:", outlines)
    const result = outlines || []
    console.log("✅ Returning outlines:", result)
    return result
  } catch (error) {
    console.error("❌ Failed to load outlines from storage:", error)
    return []
  }
}

/**
 * Save all outlines to storage
 */
export function saveOutlines(outlines: Outline[]): boolean {
  try {
    return save(OUTLINES_STORAGE_KEY, outlines)
  } catch (error) {
    console.error("Failed to save outlines to storage:", error)
    return false
  }
}

/**
 * Add a new outline to storage
 */
export function addOutline(outline: Outline): boolean {
  try {
    console.log("➕ Adding new outline:", outline.title, outline.id)
    const existingOutlines = loadOutlines()
    console.log("📋 Existing outlines count:", existingOutlines.length)
    const updatedOutlines = [...existingOutlines, outline]
    console.log("📝 Total outlines after adding:", updatedOutlines.length)
    const success = saveOutlines(updatedOutlines)
    console.log("💾 Save result:", success)
    return success
  } catch (error) {
    console.error("❌ Failed to add outline to storage:", error)
    return false
  }
}

/**
 * Update an existing outline in storage
 */
export function updateOutline(updatedOutline: Outline): boolean {
  try {
    const existingOutlines = loadOutlines()
    const index = existingOutlines.findIndex((outline) => outline.id === updatedOutline.id)

    if (index === -1) {
      console.warn("Outline not found for update:", updatedOutline.id)
      return false
    }

    existingOutlines[index] = updatedOutline
    return saveOutlines(existingOutlines)
  } catch (error) {
    console.error("Failed to update outline in storage:", error)
    return false
  }
}

/**
 * Delete an outline from storage
 */
export function deleteOutline(outlineId: string): boolean {
  try {
    const existingOutlines = loadOutlines()
    const filteredOutlines = existingOutlines.filter((outline) => outline.id !== outlineId)
    return saveOutlines(filteredOutlines)
  } catch (error) {
    console.error("Failed to delete outline from storage:", error)
    return false
  }
}

/**
 * Find an outline by ID
 */
export function getOutlineById(outlineId: string): Outline | null {
  try {
    const outlines = loadOutlines()
    return outlines.find((outline) => outline.id === outlineId) || null
  } catch (error) {
    console.error("Failed to get outline by ID:", error)
    return null
  }
}

/**
 * Clear all outlines from storage (for testing/reset purposes)
 */
export function clearAllOutlines(): boolean {
  try {
    return saveOutlines([])
  } catch (error) {
    console.error("Failed to clear all outlines:", error)
    return false
  }
}
