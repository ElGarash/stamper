/**
 * Integration tests for markdown import service
 */

import { importFromText, previewMarkdown } from "../app/services/markdownImportService"

// Mock the dependencies
jest.mock("@react-native-clipboard/clipboard", () => ({
  getString: jest.fn(),
}))

jest.mock("@react-native-documents/picker", () => ({
  pick: jest.fn(),
}))

describe("markdownImportService", () => {
  describe("importFromText", () => {
    it("should successfully import valid markdown", () => {
      const markdownContent = `# Test Outline
- First item
- Second item
  - Nested item
- [ ] Todo item
- [x] Completed item`

      const result = importFromText(markdownContent)

      expect(result.success).toBe(true)
      expect(result.outline).toBeDefined()
      expect(result.outline!.title).toBe("Test Outline")
      expect(result.outline!.items.length).toBeGreaterThan(0)
      expect(result.errors).toHaveLength(0)
    })

    it("should handle custom title", () => {
      const markdownContent = `- Item 1
- Item 2`

      const result = importFromText(markdownContent, { customTitle: "Custom Title" })

      expect(result.success).toBe(true)
      expect(result.outline!.title).toBe("Custom Title")
    })

    it("should fail with invalid markdown", () => {
      const invalidContent = `This is not a valid markdown list
- Missing proper spacing-item
-Another bad item`

      const result = importFromText(invalidContent)

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it("should fail with empty content", () => {
      const result = importFromText("")

      expect(result.success).toBe(false)
      expect(result.errors).toContain("No valid list items found")
    })

    it("should skip validation when requested", () => {
      const invalidContent = "- "

      const result = importFromText(invalidContent, { validateItems: false })

      // Should still fail due to empty title, but validation step is skipped
      expect(result.success).toBe(false)
    })

    it("should generate unique outline IDs", () => {
      const content = "- Test item"

      const result1 = importFromText(content)
      const result2 = importFromText(content)

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result1.outline!.id).not.toBe(result2.outline!.id)
    })

    it("should preserve item structure in outline", () => {
      const content = `# Structured Outline
- Main topic 1
  - Subtopic 1.1
  - Subtopic 1.2
- Main topic 2
- [ ] Todo item
- [x] Done item`

      const result = importFromText(content)

      expect(result.success).toBe(true)
      expect(result.outline!.items).toHaveLength(6) // Updated to expect 6 items

      // Check that nested items are flattened with indentation
      const nestedItem = result.outline!.items.find((item) => item.title.includes("Subtopic 1.1"))
      expect(nestedItem?.title).toBe("  Subtopic 1.1")
    })

    it("should import per-item markdown notes", () => {
      const content = `# Notes Import
- Topic A
  Notes for topic A.

  \`\`\`js
  console.log("A")
  \`\`\`
- Topic B
  Notes for topic B.`

      const result = importFromText(content)

      expect(result.success).toBe(true)
      const topicA = result.outline!.items.find((item) => item.title === "Topic A")
      const topicB = result.outline!.items.find((item) => item.title === "Topic B")

      expect(topicA?.notes).toContain("Notes for topic A.")
      expect(topicA?.notes).toContain("```js")
      expect(topicB?.notes).toBe("Notes for topic B.")
    })

    it("should treat nested non-checklist list blocks under checklist items as notes", () => {
      const content = `- [ ] Predicates backtracking
    We start by defining this

    \`\`\`python
    print("hello world")
    \`\`\`

    Then we move into:

    - 1
    - 2
    - 3
    - 5
    -
- [ ] Terms, variables, and values
    - [ ] A term is a variable or a value`

      const result = importFromText(content)

      expect(result.success).toBe(true)
      const firstItem = result.outline!.items.find(
        (item) => item.title === "Predicates backtracking",
      )
      const nestedBullet = result.outline!.items.find((item) => item.title.includes("- 1"))

      expect(firstItem?.notes).toContain("We start by defining this")
      expect(firstItem?.notes).toContain("```python")
      expect(firstItem?.notes).toContain("- 1")
      expect(firstItem?.notes).toContain("- 5")
      expect(nestedBullet).toBeUndefined()
    })
  })

  describe("previewMarkdown", () => {
    it("should preview valid markdown", () => {
      const content = `# Preview Test
- Item 1
- Item 2`

      const result = previewMarkdown(content)

      expect(result.isValid).toBe(true)
      expect(result.parseResult.items).toHaveLength(2)
      expect(result.previewOutline).toBeDefined()
      expect(result.previewOutline!.title).toBe("Preview Test")
      expect(result.errors).toHaveLength(0)
    })

    it("should preview invalid markdown", () => {
      const content = `Invalid content
-Bad item without space after dash`

      const result = previewMarkdown(content)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.previewOutline).toBeUndefined()
    })

    it("should handle empty content", () => {
      const result = previewMarkdown("")

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("No valid list items found")
    })

    it("should catch preview errors", () => {
      // This test ensures error handling works
      const result = previewMarkdown("- Valid item")

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe("real-world scenarios", () => {
    it("should handle typical lecture outline", () => {
      const lectureOutline = `# Introduction to TypeScript

## Setup and Installation
- Install Node.js
- Install TypeScript compiler
- Set up development environment
  - VS Code extensions
  - ESLint configuration

## Basic Types
- [ ] Cover primitive types
  - string, number, boolean
  - Arrays and tuples
- [ ] Explain type annotations
- [x] Show type inference examples

## Advanced Features
- Interfaces and types
- Generics
  - Generic functions
  - Generic classes
- Union and intersection types

## Best Practices
- [ ] Code organization
- [ ] Error handling
- [ ] Performance considerations`

      const result = importFromText(lectureOutline)

      expect(result.success).toBe(true)
      expect(result.outline!.title).toBe("Introduction to TypeScript")
      expect(result.outline!.items.length).toBeGreaterThan(10)

      // Verify nested structure is preserved
      const nestedItems = result.outline!.items.filter((item) => item.title.startsWith("  "))
      expect(nestedItems.length).toBeGreaterThan(0)
    })

    it("should handle meeting notes format", () => {
      const meetingNotes = `# Weekly Team Meeting - March 15, 2024

## Attendees
- Alice Johnson (PM)
- Bob Smith (Dev)
- Carol Davis (Design)

## Agenda Items
- [ ] Review sprint progress
- [ ] Discuss upcoming deadlines
- [x] Plan next sprint
  - Define user stories
  - Estimate effort
- [ ] Address technical debt
  - Code refactoring
  - Documentation updates

## Action Items
- [ ] Alice: Update project timeline
- [ ] Bob: Fix critical bugs
- [ ] Carol: Finalize UI mockups`

      const result = importFromText(meetingNotes)

      expect(result.success).toBe(true)
      expect(result.outline!.title).toBe("Weekly Team Meeting - March 15, 2024")

      // Should extract all the bullet points and todos
      expect(result.outline!.items.length).toBeGreaterThan(5)

      // Should handle mixed todo states
      const completedItems = result.parseResult!.items.filter((item) => item.completed === true)
      const incompleteItems = result.parseResult!.items.filter((item) => item.completed === false)
      expect(completedItems.length).toBeGreaterThan(0)
      expect(incompleteItems.length).toBeGreaterThan(0)
    })

    it("should handle recipe format", () => {
      const recipe = `# Chocolate Chip Cookies

## Ingredients
- 2 cups flour
- 1 tsp baking soda
- 1 tsp salt
- 1 cup butter
- 3/4 cup sugar
- 3/4 cup brown sugar
- 2 eggs
- 2 tsp vanilla
- 2 cups chocolate chips

## Instructions
- [ ] Preheat oven to 375°F
- [ ] Mix dry ingredients
  - Combine flour, baking soda, salt
- [ ] Cream butter and sugars
- [ ] Add eggs and vanilla
- [ ] Combine wet and dry ingredients
- [ ] Fold in chocolate chips
- [ ] Bake for 9-11 minutes`

      const result = importFromText(recipe)

      expect(result.success).toBe(true)
      expect(result.outline!.title).toBe("Chocolate Chip Cookies")

      // Should handle the mix of ingredients (bullets) and instructions (todos)
      expect(result.outline!.items.length).toBeGreaterThan(10)
    })
  })

  describe("error scenarios", () => {
    it("should handle malformed markdown gracefully", () => {
      const malformedContent = `# Title with missing items

This is just text without any list items.

Maybe some more text here.`

      const result = importFromText(malformedContent)

      expect(result.success).toBe(false)
      expect(result.errors).toContain("No valid list items found")
    })

    it("should handle mixed valid and invalid items", () => {
      const mixedContent = `# Mixed Content
- Valid item 1
-Invalid item without space
- Valid item 2
- Another valid item`

      const result = importFromText(mixedContent)

      // Should report parsing errors but may still have some valid items
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.parseResult?.items.length).toBeGreaterThan(0)
    })

    it("should handle extremely nested content", () => {
      const deeplyNested = `# Deep Nesting Test
- Level 0
  - Level 1
    - Level 2
      - Level 3
        - Level 4
          - Level 5
            - Level 6`

      const result = importFromText(deeplyNested)

      expect(result.success).toBe(true)
      expect(result.outline!.items.length).toBe(7) // All items flattened
    })
  })
})
