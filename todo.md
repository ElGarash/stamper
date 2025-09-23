# Project To-Do

This to-do list is based on the specification in `spec.md`.

# Project To-Do

This to-do list is based on the specification in `spec.md`.

## 1. Markdown List Import

- [x] Create markdown parser for bullet lists (`- item`, `* item`)
- [x] Create todo list parser (`- [ ] item`, `- [x] item`)
- [x] Support nested lists (sub-items under main topics)
- [x] Implement file picker for importing markdown files
- [x] Implement clipboard import for markdown text
- [x] Implement text input for pasting markdown lists
- [x] Create a local outline from imported markdown data

## 2. Outline Management

- [x] Create "Outlines List" screen
  - [x] Display outlines
  - [x] "Create New Outline" flow
  - [x] Clicking on an outline opens it in preview mode
- [x] Swipe interactions to delete or edit outlines
- [ ] Create "Outline Editor" screen
  - [x] Edit outline title inline
  - [x] Drag & drop items
  - [x] Add new items
  - [ ] Delete items
  - [x] Edit item inline
  - [x] Save changes and navigate back

## 3. Recording & Timer

- [x] Implement "Start Lecture" button with millisecond-accurate clock
- [x] Log timestamp when checklist items are tapped
- [x] Implement "Pause / Resume" toggle and record pause intervals
- [x] Keep screen active (prevent lock) during recording
- [x] If paused, show a full-screen backdrop filter, resume the timer on touch when paused
- [x] Record the pause intervals to exclude from final timestamps
- [x] Add Recorded Sessions list accessible from Outlines List screen, each outline shows its recorded sessions.
- [x] Add a button to control the sort order of the recorded sessions (newest first or oldest first)

## 4. Export

- [x] Add "Stop & Export" button on recording screen
- [x] Generate YouTube-friendly timestamp text block
- [x] Generate FFmpeg trimming command for non-paused segments

## 7. Testing & QA

- [ ] Unit tests for timestamp logging and export formatting
- [ ] Integration tests for markdown import and data persistence
- [ ] Manual QA of core UI flows

## 8. Cleanup

- [ ] Remove any unused code or dependencies
- [ ] Final code review and refactoring
- [ ] Update documentation and README
