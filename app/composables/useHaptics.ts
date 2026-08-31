/**
 * Mobile haptic feedback helper using the standard Web Vibration API.
 * Uses 25ms+ durations to exceed Android hardware spin-up thresholds.
 * Note: iOS Safari WebKit restricts the Web Vibration API.
 */
export function useHaptics() {
  function vibrate(pattern: number | number[]) {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern)
      } catch {
        // Ignore devices with restricted permissions
      }
    }
  }

  return {
    /** Tactile 25ms tick for date selection, mood taps, tab switches */
    light: () => vibrate(25),
    /** Solid 45ms tap for button presses, opens, modal toggles */
    medium: () => vibrate(45),
    /** Double pulse for confirmed saves, AI generation, milestone creation */
    success: () => vibrate([30, 60, 30]),
    /** Double warning pulse for conflict warning triggers */
    warning: () => vibrate([45, 75, 45]),
  }
}
