export function BubblogIcon({ size = 32, color = 'currentColor', strokeScale = 1 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="8" cy="15" r="5" stroke={color} strokeWidth={1.3 * strokeScale} />
      <ellipse cx="5.9" cy="12.9" rx="1.6" ry="0.9" fill={color} opacity="0.25" transform="rotate(-30 5.9 12.9)" />
      <circle cx="18" cy="7" r="3" stroke={color} strokeWidth={1.2 * strokeScale} />
      <ellipse cx="16.9" cy="5.9" rx="0.9" ry="0.5" fill={color} opacity="0.25" transform="rotate(-30 16.9 5.9)" />
      <circle cx="19.5" cy="17.5" r="1.8" stroke={color} strokeWidth={1.1 * strokeScale} />
      <ellipse cx="18.8" cy="16.8" rx="0.55" ry="0.32" fill={color} opacity="0.25" transform="rotate(-30 18.8 16.8)" />
    </svg>
  )
}

export function BubblogWordmark({ size = 20, color = '#1f2937' }) {
  return (
    <span
      style={{
        fontSize: size,
        fontWeight: 600,
        letterSpacing: '-0.02em',
        color,
        fontFamily: "'Fraunces', serif",
        lineHeight: 1,
      }}
    >
      Bubblog
    </span>
  )
}

export default function Logo({ iconSize = 28, textSize = 18, color = '#1f2937', gap = 8 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap }}>
      <BubblogIcon size={iconSize} color={color} />
      <BubblogWordmark size={textSize} color={color} />
    </div>
  )
}
