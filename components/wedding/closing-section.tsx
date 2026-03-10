import Image from "next/image"
import { useConfig } from "@/lib/config-context"

/**
 * Closing Section - Imagen de cierre con nombres
 * 
 * Soporta las mismas opciones de namesDisplay que hero-section:
 *   font: string  -> (OPCIONAL) Google Font para los nombres
 *   logo: string  -> (OPCIONAL) Ruta a imagen de logo en vez de texto
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
    font?: string
    logo?: string
  }
}

export default function ClosingSection({
  image,
  aspectRatio = "3/4",
  coupleNames,
  namesDisplay,
}: ClosingSectionProps) {
  const config = useConfig()
  const theme = config.theme as Record<string, unknown>
  const textColor = (theme.lightBgTextColor as string) || (theme.primaryColor as string) || "#6B7F5E"

  const namesFont = namesDisplay?.font
  const namesLogo = namesDisplay?.logo

  // Build font family style if custom font specified
  const namesFontStyle = namesFont 
    ? { fontFamily: `'${namesFont}', cursive` } 
    : {}

  return (
    <section className="bg-background" style={{ color: textColor }}>
      {/* Load custom font if specified */}
      {namesFont && (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link 
            href={`https://fonts.googleapis.com/css2?family=${namesFont.replace(/ /g, "+")}:wght@300;400;500;600;700&display=swap`} 
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
      <div className="flex flex-col items-center px-6 py-14">
        <div className="mb-4 h-px w-10 bg-current/30" />
        
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
            <p className="text-center text-2xl font-light tracking-[0.2em] uppercase text-inherit sm:text-3xl md:text-4xl">
              {coupleNames.brideName}
            </p>
            <span className="my-1 block text-center text-base font-extralight tracking-[0.3em] text-inherit/50 md:text-lg">
              {coupleNames.separator}
            </span>
            <p className="text-center text-2xl font-light tracking-[0.2em] uppercase text-inherit sm:text-3xl md:text-4xl">
              {coupleNames.groomName}
            </p>
          </div>
        )}
        
        <div className="mt-4 h-px w-10 bg-current/30" />
      </div>
    </section>
  )
}
