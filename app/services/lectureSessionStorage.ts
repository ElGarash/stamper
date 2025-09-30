import { LectureSession } from "@/models/Outline"
import { load, save } from "@/utils/storage"

const LECTURE_SESSIONS_KEY = "lecture_sessions"
const PAUSED_LECTURE_STATE_KEY = "lecture_current_session"

export interface PausedLectureState {
  session: LectureSession
  timer: {
    isRunning: boolean
    startTime: number | null
    pausedTime: number
    pausedIntervals: Array<{ start: number; end: number }>
  }
  checkedItemIds: string[]
}

export function loadLectureSessions(): LectureSession[] {
  try {
    const sessions = load<LectureSession[]>(LECTURE_SESSIONS_KEY)
    return sessions || []
  } catch (error) {
    console.error("Failed to load lecture sessions:", error)
    return []
  }
}

export function saveLectureSessions(sessions: LectureSession[]): boolean {
  try {
    return save(LECTURE_SESSIONS_KEY, sessions)
  } catch (error) {
    console.error("Failed to save lecture sessions:", error)
    return false
  }
}

export function addLectureSession(session: LectureSession): boolean {
  try {
    const existing = loadLectureSessions()
    existing.push(session)
    // If the completed session matches any paused snapshot, clear it.
    const paused = loadPausedLectureState()
    if (paused && paused.session.id === session.id) {
      clearPausedLectureState()
    }
    return saveLectureSessions(existing)
  } catch (error) {
    console.error("Failed to add lecture session:", error)
    return false
  }
}

export function getSessionsForOutline(outlineId: string): LectureSession[] {
  try {
    return loadLectureSessions().filter((s) => s.outlineId === outlineId)
  } catch (error) {
    console.error("Failed to get sessions for outline:", error)
    return []
  }
}

export function deleteLectureSession(sessionId: string): boolean {
  try {
    const existing = loadLectureSessions()
    const filtered = existing.filter((s) => s.id !== sessionId)
    return saveLectureSessions(filtered)
  } catch (error) {
    console.error("Failed to delete lecture session:", error)
    return false
  }
}

// Paused / in-progress session persistence (single snapshot)
export function savePausedLectureState(state: PausedLectureState): boolean {
  try {
    return save(PAUSED_LECTURE_STATE_KEY, state)
  } catch (error) {
    console.error("Failed to save paused lecture state:", error)
    return false
  }
}

export function loadPausedLectureState(): PausedLectureState | null {
  try {
    return load<PausedLectureState | null>(PAUSED_LECTURE_STATE_KEY) || null
  } catch (error) {
    console.error("Failed to load paused lecture state:", error)
    return null
  }
}

export function clearPausedLectureState(): boolean {
  try {
    return save(PAUSED_LECTURE_STATE_KEY, null as any)
  } catch (error) {
    console.error("Failed to clear paused lecture state:", error)
    return false
  }
}
