"use client"

import { useState, useRef, useEffect } from "react"
import { Volume2, VolumeX } from "lucide-react"

interface MusicPlayerProps {
  src: string
  autoplay?: boolean
}

export default function MusicPlayer({ src, autoplay = false }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (autoplay && audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlaying(true)
      }).catch(() => {
        setIsPlaying(false)
      })
    }
  }, [autoplay])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
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
