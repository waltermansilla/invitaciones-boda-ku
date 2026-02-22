import config from "@/data/wedding-config.json"

interface Palette {
  primaryColor: string
  backgroundColor: string
  textColor: string
  lightBgTextColor: string
  darkBgTextColor: string
  accentBackground: string
}

const theme = config.theme as Record<string, unknown>

export const isDarkMode = (theme.mode as string) === "dark"

const lightPalette = theme.light as Palette | undefined
const darkPalette = theme.dark as Palette | undefined

// Active palette based on mode
export const palette: Palette = isDarkMode
  ? {
      primaryColor: darkPalette?.primaryColor || "#8A9E7A",
      backgroundColor: darkPalette?.backgroundColor || "#1A1A1A",
      textColor: darkPalette?.textColor || "#E8E4DF",
      lightBgTextColor: darkPalette?.lightBgTextColor || "#C4D4B8",
      darkBgTextColor: darkPalette?.darkBgTextColor || "#FFFFFF",
      accentBackground: darkPalette?.accentBackground || "#2A3328",
    }
  : {
      primaryColor: lightPalette?.primaryColor || "#6B7F5E",
      backgroundColor: lightPalette?.backgroundColor || "#FAF8F5",
      textColor: lightPalette?.textColor || "#3A3A3A",
      lightBgTextColor: lightPalette?.lightBgTextColor || "#6B7F5E",
      darkBgTextColor: lightPalette?.darkBgTextColor || "#FFFFFF",
      accentBackground: lightPalette?.accentBackground || "#EDF2E8",
    }

export const modalTextColor = (theme.modalTextColor as string) || "#FFFFFF"
