"use client"

import { useState, useRef, useEffect } from "react"
import { Volume2, VolumeX } from "lucide-react"

interface MusicPlayerProps {
  src: string
  startTime?: number // segundos desde donde empieza la cancion (default: 0)
  triggerPlay?: boolean // cuando cambia a true, activa la musica (como si tocaran el boton)
}

export default function MusicPlayer({ src, startTime = 0, triggerPlay = false }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const hasTriggered = useRef(false)

  // Cuando triggerPlay cambia a true, cambiar el boton a "sonido" inmediatamente y luego reproducir
  useEffect(() => {
    if (triggerPlay && !hasTriggered.current) {
      hasTriggered.current = true
      // Cambiar el icono a "sonido" inmediatamente (sin esperar que cargue el audio)
      setIsPlaying(true)
      
      // Luego intentar reproducir el audio
      if (audioRef.current) {
        if (startTime > 0) {
          audioRef.current.currentTime = startTime
        }
        audioRef.current.play().catch(() => {
          // Si falla, el boton ya esta en modo "sonido", el usuario puede reintentarlo
        })
      }
    }
  }, [triggerPlay, startTime])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      if (startTime > 0 && audioRef.current.currentTime === 0) {
        audioRef.current.currentTime = startTime
      }
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  return (
    <>
      <audio ref={audioRef} src={src} loop preload="none" />
      <button
        onClick={togglePlay}
        aria-label={isPlaying ? "Pausar musica" : "Reproducir musica"}
        className="fixed right-4 bottom-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        {isPlaying ? (
          <Volume2 className="h-5 w-5" strokeWidth={1.5} />
        ) : (
          <VolumeX className="h-5 w-5" strokeWidth={1.5} />
        )}
      </button>
    </>
  )
}
