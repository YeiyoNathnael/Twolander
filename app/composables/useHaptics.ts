/**
 * Subtle mobile haptic feedback helper using the standard Web Vibration API.
 * Safely degrades on unsupported devices/desktops.
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
    /** Ultra-light 8ms tick for date selection, mood taps, tab switches */
    light: () => vibrate(8),
    /** Subtle 15ms tap for button presses, opens, modal toggles */
    medium: () => vibrate(15),
    /** Double pulse for confirmed saves, AI generation, milestone creation */
    success: () => vibrate([10, 40, 12]),
    /** Double warning pulse for conflict warning triggers */
    warning: () => vibrate([20, 50, 20]),
  }
}
