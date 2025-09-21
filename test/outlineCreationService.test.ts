import {
  createOutlineFromMarkdown,
  createOutlineFromMarkdownWithAutoTitle,
  createOutlinesFromMarkdownBatch,
  validateMarkdownForOutlineCreation,
} from "../app/services/outlineCreationService"
import { loadOutlines } from "../app/services/outlineStorage"

jest.mock("@react-native-clipboard/clipboard", () => ({
  getString: jest.fn(),
}))

jest.mock("@react-native-documents/picker", () => ({
  pick: jest.fn(),
}))

// Mock storage with in-memory implementation
const mockStorage: { [key: string]: string } = {}

jest.mock("../app/utils/storage", () => ({
  load: jest.fn((key: string) => {
    const value = mockStorage[key]
    return value ? JSON.parse(value) : null
  }),
  save: jest.fn((key: string, value: unknown) => {
    try {
      mockStorage[key] = JSON.stringify(value)
      return true
    } catch {
      return false
    }
  }),
  clear: jest.fn(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key])
  }),
}))

beforeEach(() => {
  // Clear mock storage before each test
  Object.keys(mockStorage).forEach((key) => delete mockStorage[key])
})

describe("Outline Creation Service", () => {
  it("creates and persists an outline from markdown", () => {
    const markdown = `# My Outline\n- Item 1\n- Item 2\n  - Subitem 2.1\n- [ ] Todo Item`
    const result = createOutlineFromMarkdown(markdown)
    expect(result.success).toBe(true)
    expect(result.outline).toBeDefined()
    expect(result.outline!.title).toBe("My Outline")
    expect(result.outline!.items.length).toBeGreaterThan(0)
    // Should be persisted
    const outlines = loadOutlines()
    expect(outlines.length).toBe(1)
    expect(outlines[0].title).toBe("My Outline")
  })

  it("prevents duplicate outline titles by default", () => {
    const markdown = `# Outline\n- Item 1`
    createOutlineFromMarkdown(markdown)
    const result = createOutlineFromMarkdown(markdown)
    expect(result.success).toBe(false)
    expect(result.alreadyExists).toBe(true)
    expect(result.errors[0]).toMatch(/already exists/)
    expect(loadOutlines().length).toBe(1)
  })

  it("allows duplicate titles if specified", () => {
    const markdown = `# Outline\n- Item 1`
    createOutlineFromMarkdown(markdown)
    const result = createOutlineFromMarkdown(markdown, { allowDuplicateTitles: true })
    expect(result.success).toBe(true)
    expect(loadOutlines().length).toBe(2)
  })

  it("creates outline with auto-generated unique title", () => {
    const markdown = `- Item 1`
    createOutlineFromMarkdownWithAutoTitle(markdown, "Imported Outline")
    const result = createOutlineFromMarkdownWithAutoTitle(markdown, "Imported Outline")
    expect(result.success).toBe(true)
    expect(result.outline!.title).toMatch(/Imported Outline/)
    expect(loadOutlines().length).toBe(2)
  })

  it("creates multiple outlines from batch", () => {
    const batch = [
      { content: "# A\n- 1", title: "A" },
      { content: "# B\n- 2", title: "B" },
      { content: "- 3", title: "C" },
    ]
    const result = createOutlinesFromMarkdownBatch(batch)
    expect(result.success).toBe(true)
    expect(result.successCount).toBe(3)
    expect(loadOutlines().length).toBe(3)
  })

  it("validates markdown before outline creation", () => {
    const valid = validateMarkdownForOutlineCreation("# Title\n- Item")
    expect(valid.isValid).toBe(true)
    expect(valid.errors.length).toBe(0)
    expect(valid.previewTitle).toBe("Title")
    expect(valid.itemCount).toBe(1)

    const invalid = validateMarkdownForOutlineCreation("This is not a list")
    expect(invalid.isValid).toBe(false)
    expect(invalid.errors.length).toBeGreaterThan(0)
  })
})
