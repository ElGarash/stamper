/**
 * Unit tests for markdown parser utilities
 */

import {
  parseMarkdownList,
  validateMarkdownItems,
  flattenMarkdownItems,
  convertToOutlineFormat,
  ParsedMarkdownItem,
} from "../app/utils/markdownParser"

describe("markdownParser", () => {
  describe("parseMarkdownList", () => {
    it("should parse simple bullet lists", () => {
      const content = `# My Outline
- Item 1
- Item 2
- Item 3`

      const result = parseMarkdownList(content)

      expect(result.errors).toHaveLength(0)
      expect(result.title).toBe("My Outline")
      expect(result.items).toHaveLength(3)
      expect(result.items[0].title).toBe("Item 1")
      expect(result.items[0].level).toBe(0)
    })

    it("should parse asterisk bullet lists", () => {
      const content = `* First item
* Second item
* Third item`

      const result = parseMarkdownList(content)

      expect(result.errors).toHaveLength(0)
      expect(result.items).toHaveLength(3)
      expect(result.items[0].title).toBe("First item")
    })

    it("should parse todo lists", () => {
      const content = `# Todo List
- [ ] Incomplete task
- [x] Complete task
- [ ] Another incomplete task`

      const result = parseMarkdownList(content)

      expect(result.errors).toHaveLength(0)
      expect(result.title).toBe("Todo List")
      expect(result.items).toHaveLength(3)

      // Check the completed property exists and has correct values
      expect(result.items[0]).toHaveProperty("completed", false)
      expect(result.items[1]).toHaveProperty("completed", true)
      expect(result.items[2]).toHaveProperty("completed", false)
    })

    it("should parse nested lists", () => {
      const content = `# Nested Outline
- Topic 1
  - Subtopic 1.1
  - Subtopic 1.2
- Topic 2
  - Subtopic 2.1`

      const result = parseMarkdownList(content)

      expect(result.errors).toHaveLength(0)
      expect(result.items).toHaveLength(2)
      expect(result.items[0].title).toBe("Topic 1")
      expect(result.items[0].children).toHaveLength(2)
      expect(result.items[0].children![0].title).toBe("Subtopic 1.1")
      expect(result.items[0].children![0].level).toBe(1)
    })

    it("should handle mixed indentation levels", () => {
      const content = `- Level 0
  - Level 1
    - Level 2
      - Level 3
- Back to Level 0`

      const result = parseMarkdownList(content)

      expect(result.errors).toHaveLength(0)
      expect(result.items).toHaveLength(2)
      expect(result.items[0].children).toHaveLength(1)
      expect(result.items[0].children![0].children).toHaveLength(1)
      expect(result.items[0].children![0].children![0].children).toHaveLength(1)
    })

    it("should handle empty lines and whitespace", () => {
      const content = `# Title

- Item 1

- Item 2

  - Nested item

- Item 3`

      const result = parseMarkdownList(content)

      expect(result.errors).toHaveLength(0)
      expect(result.title).toBe("Title")
      expect(result.items).toHaveLength(3)
    })

    it("should detect invalid list formats", () => {
      const content = `- Valid item
-Invalid item without space
- Another valid item`

      const result = parseMarkdownList(content)

      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain("Invalid list format")
    })

    it("should extract title from markdown heading", () => {
      const content = `## Chapter 1: Introduction
- Point 1
- Point 2`

      const result = parseMarkdownList(content)

      expect(result.title).toBe("Chapter 1: Introduction")
    })

    it("should handle content without title", () => {
      const content = `- First item
- Second item`

      const result = parseMarkdownList(content)

      expect(result.title).toBeUndefined()
      expect(result.items).toHaveLength(2)
    })
  })

  describe("validateMarkdownItems", () => {
    it("should validate valid items", () => {
      const items: ParsedMarkdownItem[] = [
        { id: "1", title: "Valid item", level: 0 },
        { id: "2", title: "Another valid item", level: 0 },
      ]

      const result = validateMarkdownItems(items)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it("should detect empty list", () => {
      const result = validateMarkdownItems([])

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("No valid list items found")
    })

    it("should detect empty titles", () => {
      const items: ParsedMarkdownItem[] = [
        { id: "1", title: "", level: 0 },
        { id: "2", title: "Valid item", level: 0 },
      ]

      const result = validateMarkdownItems(items)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((error) => error.includes("empty title"))).toBe(true)
    })

    it("should validate nested items recursively", () => {
      const items: ParsedMarkdownItem[] = [
        {
          id: "1",
          title: "Valid parent",
          level: 0,
          children: [{ id: "2", title: "", level: 1 }],
        },
      ]

      const result = validateMarkdownItems(items)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((error) => error.includes("empty title"))).toBe(true)
    })
  })

  describe("flattenMarkdownItems", () => {
    it("should flatten simple list", () => {
      const items: ParsedMarkdownItem[] = [
        { id: "1", title: "Item 1", level: 0 },
        { id: "2", title: "Item 2", level: 0 },
      ]

      const result = flattenMarkdownItems(items)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({ id: "1", title: "Item 1" })
      expect(result[1]).toEqual({ id: "2", title: "Item 2" })
    })

    it("should flatten nested list with indentation", () => {
      const items: ParsedMarkdownItem[] = [
        {
          id: "1",
          title: "Parent",
          level: 0,
          children: [
            { id: "2", title: "Child 1", level: 1 },
            { id: "3", title: "Child 2", level: 1 },
          ],
        },
      ]

      const result = flattenMarkdownItems(items)

      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({ id: "1", title: "Parent" })
      expect(result[1]).toEqual({ id: "2", title: "  Child 1" })
      expect(result[2]).toEqual({ id: "3", title: "  Child 2" })
    })

    it("should handle deep nesting", () => {
      const items: ParsedMarkdownItem[] = [
        {
          id: "1",
          title: "Level 0",
          level: 0,
          children: [
            {
              id: "2",
              title: "Level 1",
              level: 1,
              children: [{ id: "3", title: "Level 2", level: 2 }],
            },
          ],
        },
      ]

      const result = flattenMarkdownItems(items)

      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({ id: "1", title: "Level 0" })
      expect(result[1]).toEqual({ id: "2", title: "  Level 1" })
      expect(result[2]).toEqual({ id: "3", title: "    Level 2" })
    })
  })

  describe("convertToOutlineFormat", () => {
    it("should convert parse result to outline format", () => {
      const parseResult = {
        items: [
          { id: "1", title: "Item 1", level: 0 },
          { id: "2", title: "Item 2", level: 0 },
        ],
        title: "Test Outline",
        errors: [],
      }

      const result = convertToOutlineFormat(parseResult)

      expect(result.title).toBe("Test Outline")
      expect(result.items).toHaveLength(2)
      expect(result.items[0]).toEqual({ id: "1", title: "Item 1" })
    })

    it("should use custom title when provided", () => {
      const parseResult = {
        items: [{ id: "1", title: "Item 1", level: 0 }],
        title: "Original Title",
        errors: [],
      }

      const result = convertToOutlineFormat(parseResult, "Custom Title")

      expect(result.title).toBe("Custom Title")
    })

    it("should use default title when none provided", () => {
      const parseResult = {
        items: [{ id: "1", title: "Item 1", level: 0 }],
        errors: [],
      }

      const result = convertToOutlineFormat(parseResult)

      expect(result.title).toBe("Imported Outline")
    })
  })

  describe("integration tests", () => {
    it("should handle complete markdown parsing workflow", () => {
      const markdownContent = `# Lecture: React Basics

- Introduction to React
  - What is React?
  - Why use React?
- Components
  - Functional Components
  - Class Components
- State Management
- [ ] Review exercises
- [x] Complete project`

      const parseResult = parseMarkdownList(markdownContent)
      expect(parseResult.errors).toHaveLength(0)

      const validation = validateMarkdownItems(parseResult.items)
      expect(validation.isValid).toBe(true)

      const outlineFormat = convertToOutlineFormat(parseResult)
      expect(outlineFormat.title).toBe("Lecture: React Basics")
      expect(outlineFormat.items.length).toBeGreaterThan(0)

      // Check that nested items are properly flattened with indentation
      const componentsItem = outlineFormat.items.find((item) =>
        item.title.includes("Functional Components"),
      )
      expect(componentsItem?.title).toContain("  Functional Components")
    })

    it("should handle real-world markdown with mixed formats", () => {
      const realWorldContent = `# Meeting Agenda - Q1 Planning

## Attendees
- John Smith
- Jane Doe

## Topics
1. Budget Review
   - [ ] Review Q4 expenses
   - [x] Prepare Q1 budget
2. Team Updates
   * Engineering progress
   * Marketing campaigns
   * Sales targets

## Action Items
- [ ] Send meeting notes
- [ ] Schedule follow-up`

      // Even though this has numbered lists and mixed bullet styles,
      // our parser should extract the valid bullet/todo items
      const parseResult = parseMarkdownList(realWorldContent)

      // Should extract the title
      expect(parseResult.title).toBe("Meeting Agenda - Q1 Planning")

      // Should have some valid items (the bullet and todo lists)
      expect(parseResult.items.length).toBeGreaterThan(0)

      // Should handle the conversion to outline format
      const outlineFormat = convertToOutlineFormat(parseResult)
      expect(outlineFormat.items.length).toBeGreaterThan(0)
    })
  })
})
