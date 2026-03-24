import Image from "next/image"
import { useConfig } from "@/lib/config-context"

/**
 * Closing Section - Imagen de cierre con nombres
 * 
 * Soporta las mismas opciones de namesDisplay que hero-section:
 *   enabled: boolean         -> (OPCIONAL) true por defecto, false para ocultar nombres
 *   font: string             -> (OPCIONAL) Google Font para los nombres
 *   weight: string           -> (OPCIONAL) "100"-"900" o "light", "normal", "bold"
 *   size: string             -> (OPCIONAL) "sm", "base", "lg", "xl", "2xl", "3xl"
 *   style: string            -> (OPCIONAL) "normal", "italic"
 *   color: string            -> (OPCIONAL) color hex para los nombres
 *   decorativeLines: boolean -> (OPCIONAL) mostrar lineas decorativas
 *   logo: string             -> (OPCIONAL) Ruta a imagen de logo en vez de texto
 *   copyFromHero: boolean    -> (OPCIONAL) copiar estilos del hero namesDisplay
 */

interface ClosingSectionProps {
  image: string
  aspectRatio?: string
  coupleNames: {
    groomName: string
    brideName: string
    separator: string
  }
  namesDisplay?: {
    enabled?: boolean
    font?: string
    weight?: string
    size?: string
    style?: string
    color?: string
    decorativeLines?: boolean
    logo?: string
    copyFromHero?: boolean
    copyFromOverlay?: boolean
    lowercase?: boolean // true = respeta mayusculas/minusculas, false/undefined = uppercase
    letterSpacing?: string // "none", "normal", "wide" (default)
  }
}

// Map size names to Tailwind classes
const sizeMap: Record<string, string> = {
  sm: "text-lg sm:text-xl",
  base: "text-xl sm:text-2xl",
  lg: "text-2xl sm:text-3xl md:text-4xl",
  xl: "text-3xl sm:text-4xl md:text-5xl",
  "2xl": "text-4xl sm:text-5xl md:text-6xl",
  "3xl": "text-5xl sm:text-6xl md:text-7xl",
  "4xl": "text-6xl sm:text-7xl md:text-8xl",
  "5xl": "text-7xl sm:text-8xl md:text-9xl",
}

// Map weight names to CSS values
const weightMap: Record<string, string> = {
  thin: "100",
  extralight: "200",
  light: "300",
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
  black: "900",
}

export default function ClosingSection({
  image,
  aspectRatio = "3/4",
  coupleNames,
  namesDisplay,
}: ClosingSectionProps) {
  const config = useConfig()
  const theme = config.theme as Record<string, unknown>
  const hero = config.hero as Record<string, unknown> | undefined
  const overlay = config.overlay as Record<string, unknown> | undefined
  const defaultTextColor = (theme.lightBgTextColor as string) || (theme.primaryColor as string) || "#6B7F5E"

  // If copyFromHero is true, get settings from hero.namesDisplay
  const heroNamesDisplay = hero?.namesDisplay as Record<string, unknown> | undefined
  // If copyFromOverlay is true, get settings from overlay.nameStyle
  const overlayNameStyle = overlay?.nameStyle as Record<string, unknown> | undefined
  
  const shouldCopyFromHero = namesDisplay?.copyFromHero ?? false
  const shouldCopyFromOverlay = namesDisplay?.copyFromOverlay ?? false

  const isEnabled = namesDisplay?.enabled ?? true
  
  // Priority: copyFromOverlay > copyFromHero > namesDisplay defaults
  let namesFont = namesDisplay?.font
  let namesWeight = namesDisplay?.weight || "300"
  let namesSize = namesDisplay?.size || "lg"
  let namesStyle = namesDisplay?.style || "normal"
  let namesColor = namesDisplay?.color
  const namesLogo = namesDisplay?.logo
  
  if (shouldCopyFromOverlay && overlayNameStyle) {
    namesFont = (overlayNameStyle.font as string) || namesFont
    namesWeight = (overlayNameStyle.weight as string) || namesWeight
    namesSize = (overlayNameStyle.size as string) || namesSize
    namesColor = (overlayNameStyle.color as string) || namesColor
  } else if (shouldCopyFromHero && heroNamesDisplay) {
    namesFont = (heroNamesDisplay.font as string) || namesFont
    namesWeight = (heroNamesDisplay.weight as string) || namesWeight
    namesSize = (heroNamesDisplay.size as string) || namesSize
    namesStyle = (heroNamesDisplay.style as string) || namesStyle
  }
  
  const showDecorativeLines = namesDisplay?.decorativeLines ?? true

  // Resolve weight value
  const resolvedWeight = weightMap[namesWeight] || namesWeight

  // Check lowercase from overlay if copying
  const shouldLowercase = namesDisplay?.lowercase ?? 
    (shouldCopyFromOverlay && overlayNameStyle ? (overlayNameStyle.lowercase as boolean) : false)

  // Letter spacing: "none" = 0, "normal" = 0.1em, "wide" = 0.2em (default)
  const letterSpacingMap: Record<string, string> = {
    "none": "0",
    "normal": "0.1em", 
    "wide": "0.2em",
  }
  let namesLetterSpacing = namesDisplay?.letterSpacing || "wide"
  if (shouldCopyFromOverlay && overlayNameStyle?.letterSpacing) {
    namesLetterSpacing = overlayNameStyle.letterSpacing as string
  } else if (shouldCopyFromHero && heroNamesDisplay?.letterSpacing) {
    namesLetterSpacing = heroNamesDisplay.letterSpacing as string
  }
  const resolvedLetterSpacing = letterSpacingMap[namesLetterSpacing] || "0.2em"

  // Build font family style if custom font specified
  const namesFontStyle: React.CSSProperties = {
    ...(namesFont ? { fontFamily: `'${namesFont}', cursive` } : {}),
    fontWeight: resolvedWeight,
    fontStyle: namesStyle,
    color: namesColor || defaultTextColor,
    textTransform: shouldLowercase ? "none" : "uppercase",
    letterSpacing: resolvedLetterSpacing,
    ...pixelSizeStyle,
  }

  // Get size class - support pixel values like "48px"
  const isPixelSize = namesSize.endsWith("px")
  const sizeClass = isPixelSize ? "" : (sizeMap[namesSize] || sizeMap.lg)
  const pixelSizeStyle: React.CSSProperties = isPixelSize ? { fontSize: namesSize } : {}

  return (
    <section className="bg-background" style={{ color: defaultTextColor }}>
      {/* Load custom font if specified */}
      {namesFont && (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link 
            href={`https://fonts.googleapis.com/css2?family=${namesFont.replace(/ /g, "+")}:wght@100;200;300;400;500;600;700;800;900&display=swap`} 
            rel="stylesheet" 
          />
        </>
      )}

      {/* Full-width closing image */}
      <div className="relative w-full" style={{ aspectRatio }}>
        <Image
          src={image}
          alt="Foto de cierre"
          fill
          className="object-cover"
        />
      </div>

      {/* Names or Logo as elegant close */}
      {isEnabled && (
        <div className="flex flex-col items-center px-6 py-14">
          {showDecorativeLines && (
            <div className="mb-4 h-px w-10 bg-current/30" />
          )}
          
          {namesLogo ? (
            // Show logo instead of names
            <Image
              src={namesLogo}
              alt="Logo"
              width={180}
              height={90}
              className="max-h-20 w-auto object-contain sm:max-h-24"
            />
          ) : (
            // Show names as text
            <div style={namesFontStyle}>
              <p className={`text-center ${sizeClass}`}>
                {coupleNames.brideName}
              </p>
              {coupleNames.separator && (
                <span className="my-1 block text-center text-base font-extralight tracking-[0.3em] opacity-50 md:text-lg">
                  {coupleNames.separator}
                </span>
              )}
              {coupleNames.groomName && (
                <p className={`text-center ${sizeClass}`}>
                  {coupleNames.groomName}
                </p>
              )}
            </div>
          )}
          
          {showDecorativeLines && (
            <div className="mt-4 h-px w-10 bg-current/30" />
          )}
        </div>
      )}
    </section>
  )
}
