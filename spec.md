# Lecture-Editing Companion App Specification

## 1. Overview

A mobile app to speed up lecture post-production by:

- Importing or creating your lecture outline as a checklist
- Recording timestamps as you cover each checklist item
- Pausing to mark “dead” segments that should be cut out
- Generating YouTube-friendly timestamps and an FFmpeg command to remove paused segments

## 2. User Stories

1. As an instructor, I want to import a Notion page checklist so I don’t have to retype my outline.
   - Parse markdown bullet lists (`- item`, `* item`) and todo lists (`- [ ] item`, `- [x] item`) into checklist items

   - Support for nested lists (sub-items under main topics) instructor

2. As an instructor, I want to manually create or edit my lecture checklist in the app.
3. As an instructor, I want to start a live timer when my lecture begins.
4. As an instructor, when I tick off a checklist item, I want the exact timestamp recorded.
5. As an instructor, I want a “Pause” button so I can mark breaks or digressions.
6. As an instructor, I want to export a list of “covered topic – timestamp” pairs for YouTube.
7. As an instructor, I want the app to generate an FFmpeg trimming command that removes all paused intervals.
8. As an instructor, I want the screen to remain active (not lock) during recording.
9. As an instructor, If I touch the screen while paused, I want the timer to resume.

## 3. Functional Requirements

### 3.1 Checklist Management

- Sign in with Notion (OAuth2) and fetch pages tagged “Lecture Outline”
- Parse a top-level bullet list into items with titles

### 3.2 Timer & Recording

- “Start Lecture” button begins a millisecond-accurate clock
- Tapping a checklist item logs a timestamp = clock time
- “Pause” / “Resume” toggle records pause intervals (`[{ start, end }, …]`)

### 3.3 Export

- **YouTube Timestamps**: text block like:
  ```
  00:00 Intro
  03:45 Topic 1
  …
  ```
- **FFmpeg command**:
  ```bash
  ffmpeg -i input.mp4 -vf "select='between(t,0,T₀)+between(t,T₁,T₂)+…'" -af "aselect='between(t,0,T₀)+…'" -o output_trimmed.mp4
  ```
  where intervals represent non-paused segments (T₀=0, etc.)

### 3.4 Data Persistence

- Local device storage (Realm or SQLite)
- Optional cloud sync (future)

### 3.5 Settings

- Default video file name/path
- Output folder
- Time format (mm:ss vs hh:mm:ss)

## 4. Screen Flows

1. **Welcome / Onboarding**
   - Brief tutorial
   - Connect Notion
2. **Outlines List**
   - Show imported & local outlines
   - - Create New Outline
3. **Outline Editor**
   - Drag & drop items
   - Edit titles
   - Save & Back
4. **Recording Screen**
   - Large timer display
   - Checklist view (tap to mark done)
   - “Pause / Resume” button
   - “Stop & Export” button
5. **Export Preview**
   - Show YouTube timestamps text + copy button
   - Show FFmpeg command + copy button

## 5. Data Models

```ts
// Outline model
interface Outline {
  id: string // UUID
  title: string
  items: Array<{ id: string; title: string; coveredAt?: number }>
}

// Lecture session model
interface LectureSession {
  id: string
  outlineId: string
  startedAt: number
  pausedIntervals: Array<{ start: number; end: number }>
  itemTimestamps: Array<{ itemId: string; timestamp: number }>
  completedAt?: number
}
```

## 6. Architecture & Technology

- Storage: SQLite via `react-native-sqlite-storage`
- Notion integration: `@notionhq/client`
- Time utilities: `dayjs`
- FFmpeg command builder: custom utility module

## 7. Non-Functional Requirements

- Millisecond timer accuracy
- Offline-first (local storage)
- Export operations run client-side
- Simple, one-handed UI for in-lecture use

## 8. Acceptance Criteria

- Imported Notion pages parse top-level bullets correctly
- Tapping items logs accurate timestamps relative to start
- Pause intervals are correctly excluded by the generated FFmpeg command
- Export text matches YouTube’s timestamp format

## 9. Future Enhancements

- Cloud sync & multi-device support
- In-app video preview & trimming UI
- YouTube Data API integration for auto-chapter creation
