import {
  clearPausedLectureState,
  loadPausedLectureState,
} from "../app/services/lectureSessionStorage"
import { lectureTimerService } from "../app/services/lectureTimerService"

// Simple mock outline
const outline = { id: "outline1", title: "Test", items: [{ id: "i1", title: "Item 1" }] }

describe("Paused resume persistence", () => {
  beforeEach(() => {
    try {
      // @ts-ignore attempt to stop if active
      lectureTimerService.stopLecture()
    } catch {}
    clearPausedLectureState()
  })

  it("persists paused snapshot and restores", () => {
    lectureTimerService.startLecture(outline as any)
    lectureTimerService.logItemCovered("i1")
    lectureTimerService.pauseLecture()

    const snapshot = loadPausedLectureState()
    expect(snapshot).toBeTruthy()
    expect(snapshot!.session.outlineId).toBe(outline.id)
    expect(snapshot!.checkedItemIds).toContain("i1")

    const restored = lectureTimerService.restorePausedLecture()
    expect(restored).toBe(true)

    // Ensure timestamp present in restored session (used for rebuild fallback)
    const restoredSession = lectureTimerService.getCurrentSession?.()
    expect(restoredSession?.itemTimestamps.find((t: any) => t.itemId === "i1")).toBeTruthy()
  })
})
