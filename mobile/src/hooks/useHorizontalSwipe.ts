import { useRef } from 'react'
import { PanResponder } from 'react-native'

const DRAG_ACTIVATE_PX = 12
const SWIPE_THRESHOLD_PX = 56
const MAX_VERTICAL_RATIO = 1.25

export function useHorizontalSwipe(onSwipeLeft: () => void, onSwipeRight: () => void, enabled = true) {
  const session = useRef<{
    x: number
    y: number
    dragging: boolean
  } | null>(null)

  const onSwipeLeftRef = useRef(onSwipeLeft)
  const onSwipeRightRef = useRef(onSwipeRight)
  onSwipeLeftRef.current = onSwipeLeft
  onSwipeRightRef.current = onSwipeRight

  return PanResponder.create({
    onStartShouldSetPanResponder: () => enabled,
    onMoveShouldSetPanResponder: (_, g) => {
      if (!enabled) return false
      return Math.abs(g.dx) > DRAG_ACTIVATE_PX && Math.abs(g.dx) > Math.abs(g.dy) * 0.8
    },
    onPanResponderGrant: (_, g) => {
      session.current = { x: g.x0, y: g.y0, dragging: false }
    },
    onPanResponderMove: (_, g) => {
      const s = session.current
      if (!s || s.dragging) return
      const dx = g.moveX - s.x
      const dy = g.moveY - s.y
      if (Math.abs(dx) > DRAG_ACTIVATE_PX && Math.abs(dx) > Math.abs(dy) * 0.8) {
        s.dragging = true
      }
    },
    onPanResponderRelease: (_, g) => {
      const s = session.current
      session.current = null
      if (!s?.dragging) return

      const dx = g.moveX - s.x
      const dy = g.moveY - s.y
      if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return
      if (Math.abs(dx) < Math.abs(dy) * MAX_VERTICAL_RATIO) return

      if (dx < 0) onSwipeLeftRef.current()
      else onSwipeRightRef.current()
    },
    onPanResponderTerminate: () => {
      session.current = null
    },
  })
}
