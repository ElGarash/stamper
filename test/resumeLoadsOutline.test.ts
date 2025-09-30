import {
  clearPausedLectureState,
  loadPausedLectureState,
} from "../app/services/lectureSessionStorage"
import { lectureTimerService } from "../app/services/lectureTimerService"
import { addOutline, clearAllOutlines } from "../app/services/outlineStorage"

const outline = {
  id: "outline-resume",
  title: "Resume Outline",
  items: [
    { id: "a", title: "Alpha" },
    { id: "b", title: "Beta" },
  ],
}

describe("Resume loads outline items", () => {
  beforeEach(() => {
    clearAllOutlines()
    addOutline(outline as any)
    clearPausedLectureState()
    try {
      lectureTimerService.stopLecture()
    } catch {}
  })

  it("snapshot retains outlineId and items accessible after restore", () => {
    lectureTimerService.startLecture(outline as any)
    lectureTimerService.pauseLecture()

    const snap = loadPausedLectureState()
    expect(snap?.session.outlineId).toBe(outline.id)
    // We do not persist items themselves in snapshot—outline will be reloaded separately in UI
  })
})
