"use client"

import { useState, useRef, useEffect } from "react"
import { Volume2, VolumeX } from "lucide-react"

interface MusicPlayerProps {
  src: string
  autoplay?: boolean
  startTime?: number // segundos desde donde empieza la cancion (default: 0)
  triggerPlay?: boolean // cuando cambia a true, inicia la musica (para iniciar desde overlay)
}

export default function MusicPlayer({ src, autoplay = false, startTime = 0, triggerPlay = false }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (audioRef.current && startTime > 0) {
      audioRef.current.currentTime = startTime
    }
  }, [startTime])

  // Trigger play when overlay is dismissed (triggerPlay changes to true)
  useEffect(() => {
    if (triggerPlay && audioRef.current && !isPlaying) {
      if (startTime > 0) {
        audioRef.current.currentTime = startTime
      }
      audioRef.current.play().then(() => {
        setIsPlaying(true)
      }).catch(() => {
        setIsPlaying(false)
      })
    }
  }, [triggerPlay, startTime, isPlaying])

  // Fallback: try autoplay on mount (may fail on mobile without user interaction)
  useEffect(() => {
    if (autoplay && !triggerPlay && audioRef.current) {
      if (startTime > 0) {
        audioRef.current.currentTime = startTime
      }
      audioRef.current.play().then(() => {
        setIsPlaying(true)
      }).catch(() => {
        setIsPlaying(false)
      })
    }
  }, [autoplay, startTime, triggerPlay])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      // Si esta al inicio y hay startTime, saltar a ese punto
      if (audioRef.current.currentTime === 0 && startTime > 0) {
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
