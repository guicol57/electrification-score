/* ── Ecodex Logo ── */
export function EcodexLogo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="52 27 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ecoGrad1" x1="57" y1="32" x2="127" y2="102" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6B7CFF" />
          <stop offset="100%" stopColor="#3B4AE0" />
        </linearGradient>
        <linearGradient id="ecoGrad2" x1="57" y1="50" x2="97" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9BA8FF" />
          <stop offset="100%" stopColor="#5B6BFF" />
        </linearGradient>
      </defs>
      <path d="M57.07 47.97V35.24c0-1.69 1.37-3.07 3.07-3.07h34.06c17.96 0 32.53 14.56 32.53 32.53v2.38 2.22c0 17.96-14.56 32.53-32.53 32.53H60.14c-1.69 0-3.07-1.37-3.07-3.07V85.72c0-1.69 1.37-3.07 3.07-3.07h31.45c8.73 0 15.8-7.08 15.8-15.8 0-8.73-7.08-15.8-15.8-15.8H60.14c-1.69 0-3.07-1.37-3.07-3.07z" fill="url(#ecoGrad1)" />
      <path d="M57.07 63.32c0-1.36 1.1-2.45 2.45-2.45h31c3.39 0 6.14 2.75 6.14 6.14s-2.75 6.14-6.14 6.14h-31c-1.36 0-2.45-1.1-2.45-2.45v-7.36z" fill="url(#ecoGrad2)" />
    </svg>
  )
}

/* ── GitHub Logo ── */
export function GitHubLogo({ size = 12, fill = 'currentColor' }: { size?: number; fill?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={fill}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}
