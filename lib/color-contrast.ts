const BASE_MODAL_BG = { r: 31, g: 31, b: 31 }

function srgbChannelToLinear(channel: number): number {
  const v = channel / 255
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

export function relativeLuminance(rgb: { r: number; g: number; b: number }): number {
  return (
    0.2126 * srgbChannelToLinear(rgb.r) +
    0.7152 * srgbChannelToLinear(rgb.g) +
    0.0722 * srgbChannelToLinear(rgb.b)
  )
}

export function contrastRatio(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number }
): number {
  const l1 = relativeLuminance(a)
  const l2 = relativeLuminance(b)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/** Parses #rgb, #rrggbb and common 6-digit hex without hash. */
export function parseHexColor(input: string): { r: number; g: number; b: number } | null {
  const raw = input.trim()
  if (!raw) return null

  let hex = raw.startsWith("#") ? raw.slice(1) : raw
  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("")
  }
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null

  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  }
}

/** CTA colors for dark base modals: invert when primary blends with modal bg. */
export function getBaseModalPrimaryButtonColors(primaryColor: string): {
  background: string
  foreground: string
} {
  const primaryRgb = parseHexColor(primaryColor)
  if (!primaryRgb) {
    return { background: "#ffffff", foreground: "#111111" }
  }

  const modalContrast = contrastRatio(primaryRgb, BASE_MODAL_BG)
  if (modalContrast < 3) {
    return { background: "#ffffff", foreground: primaryColor.trim() }
  }

  const primaryLuminance = relativeLuminance(primaryRgb)
  return {
    background: primaryColor.trim(),
    foreground: primaryLuminance > 0.55 ? "#111111" : "#ffffff",
  }
}
