# Project To-Do

This to-do list is based on the specification in `spec.md`.

# Project To-Do

This to-do list is based on the specification in `spec.md`.

## 1. Markdown List Import

- [ ] Create markdown parser for bullet lists (`- item`, `* item`)
- [ ] Create todo list parser (`- [ ] item`, `- [x] item`)
- [ ] Support nested lists (sub-items under main topics)
- [ ] Implement file picker for importing markdown files
- [ ] Implement clipboard import for markdown text
- [ ] Implement text input for pasting markdown lists
- [ ] Create a local outline from imported markdown data

## 2. Outline Management

- [ ] Create "Outlines List" screen
  - [ ] Display imported and local outlines
  - [ ] "Create New Outline" flow
  - [ ] "Import from markdown/todo list" flow
- [ ] Create "Outline Editor" screen
  - [ ] Drag & drop items
  - [ ] Edit item titles inline
  - [ ] Save changes and navigate back

## 3. Recording & Timer

- [ ] Implement "Start Lecture" button with millisecond-accurate clock
- [ ] Log timestamp when checklist items are tapped
- [ ] Implement "Pause / Resume" toggle and record pause intervals
- [ ] Keep screen active (prevent lock) during recording
- [ ] Resume timer on touch when paused

## 4. Export

- [ ] Add "Stop & Export" button on recording screen
- [ ] Generate YouTube-friendly timestamp text block
- [ ] Generate FFmpeg trimming command for non-paused segments
- [ ] Create Export Preview screen with copy buttons for timestamps and command

## 5. Data Persistence

- [ ] Set up SQLite storage via `react-native-sqlite-storage`
- [ ] Define `Outline` and `LectureSession` models
- [ ] Implement CRUD operations for outlines and lecture sessions

## 6. Settings

- [ ] Default video file name/path configuration
- [ ] Output folder selection
- [ ] Time format option (mm:ss vs hh:mm:ss)

## 7. Testing & QA

- [ ] Unit tests for timestamp logging and export formatting
- [ ] Integration tests for markdown import and data persistence
- [ ] Manual QA of core UI flows

## 8. Cleanup

- [ ] Remove any unused code or dependencies
- [ ] Final code review and refactoring
- [ ] Update documentation and README
