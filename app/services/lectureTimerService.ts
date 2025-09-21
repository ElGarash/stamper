import { Outline, LectureSession } from "@/models/Outline"

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

    /**
     * Start a new lecture session
     */
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

        this.notifyListeners()
        return this.currentSession
    }

    /**
     * Pause the current lecture session
     */
    pauseLecture(): void {
        if (!this.timerState.isRunning || !this.currentSession) return

        const now = Date.now()
        this.timerState.isRunning = false

        // Start a new pause interval
        this.timerState.pausedIntervals.push({ start: now, end: 0 })

        this.notifyListeners()
    }

    /**
     * Resume the current lecture session
     */
    resumeLecture(): void {
        if (this.timerState.isRunning || !this.currentSession) return

        const now = Date.now()
        this.timerState.isRunning = true

        // Close the current pause interval
        const currentPauseInterval =
            this.timerState.pausedIntervals[this.timerState.pausedIntervals.length - 1]
        if (currentPauseInterval && currentPauseInterval.end === 0) {
            currentPauseInterval.end = now
            this.timerState.pausedTime += now - currentPauseInterval.start

            // Also update the session
            this.currentSession.pausedIntervals.push(currentPauseInterval)
        }

        this.notifyListeners()
    }

    /**
     * Stop the current lecture session
     */
    stopLecture(): LectureSession | null {
        if (!this.currentSession) return null

        const now = Date.now()

        // If currently running, pause first
        if (this.timerState.isRunning) {
            this.pauseLecture()
        }

        // Close any open pause interval
        const openPauseInterval = this.timerState.pausedIntervals.find((interval) => interval.end === 0)
        if (openPauseInterval) {
            openPauseInterval.end = now
            this.timerState.pausedTime += now - openPauseInterval.start
        }

        // Complete the session
        this.currentSession.completedAt = now
        this.currentSession.pausedIntervals = [...this.timerState.pausedIntervals]

        const completedSession = this.currentSession

        // Log timestamps on export for debugging
        try {
            // eslint-disable-next-line no-console
            console.log(`Lecture export - session id: ${completedSession.id}`)
            // eslint-disable-next-line no-console
            console.log("Item timestamps:")
            completedSession.itemTimestamps.forEach((entry) => {
                // eslint-disable-next-line no-console
                console.log(
                    `  - itemId=${entry.itemId} timestamp=${entry.timestamp} (${new Date(
                        entry.timestamp,
                    ).toISOString()})`,
                )
            })
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error("Failed to log lecture timestamps:", err)
        }

        // Reset state
        this.currentSession = null
        this.timerState = {
            isRunning: false,
            startTime: null,
            pausedTime: 0,
            pausedIntervals: [],
        }

        this.notifyListeners()
        return completedSession
    }

    /**
     * Log when an outline item is covered
     */
    logItemCovered(itemId: string): void {
        if (!this.currentSession) return

        const timestamp = Date.now()

        // Remove any existing timestamp for this item
        this.currentSession.itemTimestamps = this.currentSession.itemTimestamps.filter(
            (entry) => entry.itemId !== itemId,
        )

        // Add new timestamp
        this.currentSession.itemTimestamps.push({
            itemId,
            timestamp,
        })
    }

    /**
     * Remove timestamp for an item (when unchecked)
     */
    removeItemTimestamp(itemId: string): void {
        if (!this.currentSession) return

        this.currentSession.itemTimestamps = this.currentSession.itemTimestamps.filter(
            (entry) => entry.itemId !== itemId,
        )
    }

    /**
     * Get the current elapsed time in milliseconds (excluding paused time)
     */
    getElapsedTime(): number {
        if (!this.timerState.startTime) return 0

        const now = Date.now()
        const totalElapsed = now - this.timerState.startTime

        let pausedTime = this.timerState.pausedTime

        // Add current pause time if paused
        if (!this.timerState.isRunning) {
            const currentPauseInterval =
                this.timerState.pausedIntervals[this.timerState.pausedIntervals.length - 1]
            if (currentPauseInterval && currentPauseInterval.end === 0) {
                pausedTime += now - currentPauseInterval.start
            }
        }

        return totalElapsed - pausedTime
    }

    /**
     * Get current timer state
     */
    getTimerState(): TimerState {
        return { ...this.timerState }
    }

    /**
     * Get current session
     */
    getCurrentSession(): LectureSession | null {
        return this.currentSession ? { ...this.currentSession } : null
    }

    /**
     * Subscribe to timer state changes
     */
    addListener(listener: (state: TimerState) => void): () => void {
        this.listeners.add(listener)
        return () => this.listeners.delete(listener)
    }

    /**
     * Format elapsed time as mm:ss or hh:mm:ss
     */
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
}

// Export singleton instance
export const lectureTimerService = new LectureTimerService()