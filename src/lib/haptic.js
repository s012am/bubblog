export function haptic(ms = 12) {
  try { navigator.vibrate?.(ms) } catch {}
}
