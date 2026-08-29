'use client'

import { useEffect, useRef, useState } from 'react'
import { Pause, Play, Speaker } from 'lucide-react'

interface ReceivedAudioProps {
  audioKey: number
  apiBase: string
}

export function ReceivedAudio({ audioKey, apiBase }: ReceivedAudioProps) {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    setPlaying(false)
  }, [audioKey])

  const handlePlay = () => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
    } else {
      audioRef.current.currentTime = 0
      audioRef.current.play()
      setPlaying(true)
    }
  }

  return (
    <section
      className="itantra-rise rounded-2xl border border-border bg-card/80 p-6 shadow-2xl backdrop-blur-sm sm:p-8"
      aria-label="Received audio playback"
    >
      <div className="mb-4 flex items-center gap-2">
        <Speaker className="size-4 text-accent" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-foreground">Receiver output</h2>
        <span className="text-xs text-muted-foreground">— actual synthesized speech from backend</span>
      </div>

      <div className="flex items-center gap-4 rounded-xl border border-border bg-background/40 p-4">
        <button
          type="button"
          onClick={handlePlay}
          aria-label={playing ? 'Pause playback' : 'Play received audio'}
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/50"
        >
          {playing ? (
            <Pause className="size-5 fill-current" aria-hidden="true" />
          ) : (
            <Play className="size-5 translate-x-0.5 fill-current" aria-hidden="true" />
          )}
        </button>

        <audio
          key={audioKey}
          ref={audioRef}
          src={`${apiBase}/api/received-audio?t=${audioKey}`}
          onEnded={() => setPlaying(false)}
          className="flex-1"
          controls
        />
      </div>
    </section>
  )
}