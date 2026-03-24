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

  // Cuando triggerPlay cambia a true, activar la musica (como si tocaran el boton)
  useEffect(() => {
    if (triggerPlay && !hasTriggered.current && audioRef.current) {
      hasTriggered.current = true
      if (startTime > 0) {
        audioRef.current.currentTime = startTime
      }
      audioRef.current.play().then(() => {
        setIsPlaying(true)
      }).catch(() => {
        // Si falla, al menos el estado queda en "playing" visualmente
        setIsPlaying(true)
      })
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
