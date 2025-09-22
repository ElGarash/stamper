import { LectureSession } from "@/models/Outline"
import { load, save } from "@/utils/storage"

const LECTURE_SESSIONS_KEY = "lecture_sessions"

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
