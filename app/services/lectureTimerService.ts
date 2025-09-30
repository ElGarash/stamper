import { Outline, LectureSession } from "@/models/Outline"
import {
  addLectureSession,
  loadLectureSessions,
  savePausedLectureState,
  loadPausedLectureState,
  clearPausedLectureState,
} from "@/services/lectureSessionStorage"

export interface TimerState {
  isRunning: boolean
  startTime: number | null
  pausedTime: number
  pausedIntervals: Array<{ start: number; end: number }>
}

class LectureTimerService {
  private timerState: TimerState = {
    isRunning: false,
    startTime: null,
    pausedTime: 0,
    pausedIntervals: [],
  }

  private currentSession: LectureSession | null = null
  private listeners: Set<(state: TimerState) => void> = new Set()
  private checkedItemIds: Set<string> = new Set()

  /** Restore a previously paused (not completed) session */
  restorePausedLecture(): boolean {
    try {
      const snapshot = loadPausedLectureState()
      if (!snapshot) return false
      this.currentSession = snapshot.session
      this.timerState = { ...snapshot.timer }
      this.checkedItemIds = new Set(snapshot.checkedItemIds)
      if (this.timerState.isRunning) {
        this.timerState.isRunning = false
        const now = Date.now()
        this.timerState.pausedIntervals.push({ start: now, end: 0 })
      }
      this.notifyListeners()
      return true
    } catch (e) {
      console.error("Failed to restore paused lecture:", e)
      return false
    }
  }

  getCheckedItemIds(): string[] {
    return Array.from(this.checkedItemIds)
  }

  getCoveredItemIds(): string[] {
    if (!this.currentSession) return []
    return this.currentSession.itemTimestamps.map((t) => t.itemId)
  }

  /** Start a new lecture session */
  startLecture(outline: Outline): LectureSession {
    const now = Date.now()

    this.currentSession = {
      id: this.generateSessionId(),
      outlineId: outline.id,
      startedAt: now,
      pausedIntervals: [],
      itemTimestamps: [],
    }

    this.timerState = {
      isRunning: true,
      startTime: now,
      pausedTime: 0,
      pausedIntervals: [],
    }
    this.checkedItemIds = new Set()

    clearPausedLectureState()
    this.notifyListeners()
    return this.currentSession
  }

  /** Pause the current lecture session */
  pauseLecture(): void {
    if (!this.timerState.isRunning || !this.currentSession) return

    const now = Date.now()
    this.timerState.isRunning = false

    const newInterval = { start: now, end: 0 }
    this.timerState.pausedIntervals.push(newInterval)
    this.currentSession.pausedIntervals.push(newInterval as { start: number; end: number })

    try {
      console.log(`Pause started at ${newInterval.start}`)
    } catch {}
    this.persistPausedSnapshot()
    this.notifyListeners()
  }

  /** Resume the current lecture session */
  resumeLecture(): void {
    if (this.timerState.isRunning || !this.currentSession) return

    const now = Date.now()
    this.timerState.isRunning = true

    const currentPauseInterval =
      this.timerState.pausedIntervals[this.timerState.pausedIntervals.length - 1]
    if (currentPauseInterval && currentPauseInterval.end === 0) {
      currentPauseInterval.end = now
      this.timerState.pausedTime += now - currentPauseInterval.start
      try {
        console.log(
          `Pause ended start=${currentPauseInterval.start} end=${currentPauseInterval.end} duration=${currentPauseInterval.end - currentPauseInterval.start}`,
        )
      } catch {}
    }

    this.persistPausedSnapshot()
    this.notifyListeners()
  }

  /** Stop the current lecture session */
  stopLecture(): LectureSession | null {
    if (!this.currentSession) return null

    const now = Date.now()
    if (this.timerState.isRunning) {
      this.pauseLecture()
    }

    const openPauseInterval = this.timerState.pausedIntervals.find((interval) => interval.end === 0)
    if (openPauseInterval) {
      openPauseInterval.end = now
      this.timerState.pausedTime += now - openPauseInterval.start
    }

    this.currentSession.completedAt = now
    this.currentSession.pausedIntervals = [...this.timerState.pausedIntervals]

    try {
      console.log("Pause intervals (ms since epoch):")
      this.currentSession.pausedIntervals.forEach((p) => {
        console.log(`  - start=${p.start} end=${p.end} duration=${p.end - p.start}`)
      })
    } catch {}

    const completedSession = this.currentSession

    try {
      const success = addLectureSession(completedSession)
      console.log(`Saved session ${completedSession.id} persisted=${success}`)
    } catch (err) {
      console.error("Failed to persist lecture session via addLectureSession:", err)
    }

    try {
      console.log(`Lecture export - session id: ${completedSession.id}`)
      console.log("Item timestamps:")
      completedSession.itemTimestamps.forEach((entry) => {
        console.log(
          `  - itemId=${entry.itemId} timestamp=${entry.timestamp} (${new Date(
            entry.timestamp,
          ).toISOString()})`,
        )
      })
    } catch {}

    this.currentSession = null
    this.timerState = { isRunning: false, startTime: null, pausedTime: 0, pausedIntervals: [] }
    this.checkedItemIds = new Set()
    clearPausedLectureState()

    this.notifyListeners()
    return completedSession
  }

  /** Log when an outline item is covered */
  logItemCovered(itemId: string): void {
    if (!this.currentSession) return

    const timestamp = Date.now()
    this.currentSession.itemTimestamps = this.currentSession.itemTimestamps.filter(
      (entry) => entry.itemId !== itemId,
    )
    this.currentSession.itemTimestamps.push({ itemId, timestamp })
    this.checkedItemIds.add(itemId)
    this.persistPausedSnapshot()
  }

  /** Remove timestamp for an item (when unchecked) */
  removeItemTimestamp(itemId: string): void {
    if (!this.currentSession) return
    this.currentSession.itemTimestamps = this.currentSession.itemTimestamps.filter(
      (entry) => entry.itemId !== itemId,
    )
    this.checkedItemIds.delete(itemId)
    this.persistPausedSnapshot()
  }

  /** Get the current elapsed time in milliseconds (excluding paused time) */
  getElapsedTime(): number {
    if (!this.timerState.startTime) return 0
    const now = Date.now()
    const totalElapsed = now - this.timerState.startTime
    let pausedTime = this.timerState.pausedTime
    if (!this.timerState.isRunning) {
      const currentPauseInterval =
        this.timerState.pausedIntervals[this.timerState.pausedIntervals.length - 1]
      if (currentPauseInterval && currentPauseInterval.end === 0) {
        pausedTime += now - currentPauseInterval.start
      }
    }
    return totalElapsed - pausedTime
  }

  getTimerState(): TimerState {
    return { ...this.timerState }
  }
  getCurrentSession(): LectureSession | null {
    return this.currentSession ? { ...this.currentSession } : null
  }

  addListener(listener: (state: TimerState) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  formatTime(milliseconds: number, includeHours: boolean = false): string {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    if (includeHours || hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.timerState))
  }

  private persistPausedSnapshot(): void {
    if (!this.currentSession) return
    try {
      savePausedLectureState({
        session: this.currentSession,
        timer: { ...this.timerState },
        checkedItemIds: Array.from(this.checkedItemIds),
      })
    } catch (e) {
      console.error("Failed to persist paused snapshot", e)
    }
  }
}

export const lectureTimerService = new LectureTimerService()
export function loadPersistedLectureSessions(): Array<LectureSession> {
  try {
    return loadLectureSessions()
  } catch {
    return []
  }
}
