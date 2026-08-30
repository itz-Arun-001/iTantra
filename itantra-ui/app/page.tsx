'use client'

import { useCallback, useRef, useState } from 'react'
import { ControlPanel } from '@/components/itantra/control-panel'
import { FooterInfo } from '@/components/itantra/footer-info'
import { Header } from '@/components/itantra/header'
import { ReceivedAudio } from '@/components/itantra/received-audio'
import { SignalBackground } from '@/components/itantra/signal-background'
import { TranscriptionDisplay } from '@/components/itantra/transcription-display'
import { TransmissionStatsCard } from '@/components/itantra/transmission-stats'
import {
  BITRATE_OPTIONS,
  type BitrateMode,
  type Language,
  type Priority,
  type RecorderState,
  type TransmissionStats,
} from '@/components/itantra/types'

const API_BASE = 'http://localhost:5000'

export default function Page() {
  const [state, setState] = useState<RecorderState>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [bitrate, setBitrate] = useState<BitrateMode>('LOW')
  const [priority, setPriority] = useState<Priority>('normal')
  const [language, setLanguage] = useState<Language>('en')

  const [transcript, setTranscript] = useState('')
  const [stats, setStats] = useState<TransmissionStats | null>(null)
  const [audioKey, setAudioKey] = useState(0)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(0)

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const handleToggleRecord = useCallback(async () => {
    if (state === 'recording' || state === 'processing' || state === 'transmitting') {
      return
    }

    setStats(null)
    setTranscript('')
    setElapsed(0)
    setState('recording')

    startTimeRef.current = performance.now()
    timerRef.current = setInterval(() => {
      setElapsed((performance.now() - startTimeRef.current) / 1000)
    }, 100)

    try {
      // STEP 1: Record + STT
      const recordRes = await fetch(`${API_BASE}/api/step/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bitrateMode: bitrate, language }),
      })
      stopTimer()
      const recordData = await recordRes.json()

      if (!recordData.success) {
        setState('error')
        return
      }
      setTranscript(recordData.transcription)

      // STEP 2: Simulated transmission
      setState('transmitting')
      const transmitRes = await fetch(`${API_BASE}/api/step/transmit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority }),
      })
      const transmitData = await transmitRes.json()

      if (!transmitData.success) {
        setStats({
          originalBytes: recordData.originalSize,
          transmittedBytes: recordData.transmittedSize,
          reductionPct: transmitData.bandwidthReduction || 0,
          status: 'failed',
          packetsTotal: 0,
          packetsLost: (transmitData.missingPackets || []).length,
          packetsRetried: 0,
          durationSec: 0,
        })
        setState('error')
        return
      }

      // STEP 3: Synthesize speech (reuse 'processing' state to show as a final step)
      setState('processing')
      const synthRes = await fetch(`${API_BASE}/api/step/synthesize`, {
        method: 'POST',
      })
      const synthData = await synthRes.json()

      if (!synthData.success) {
        setState('error')
        return
      }

      setStats({
        originalBytes: recordData.originalSize,
        transmittedBytes: recordData.transmittedSize,
        reductionPct: transmitData.bandwidthReduction,
        status: 'delivered',
        packetsTotal: 0,
        packetsLost: 0,
        packetsRetried: 0,
        durationSec: 0,
      })
      setAudioKey((k) => k + 1)
      setState('success')

      setTimeout(() => setState('idle'), 1600)
    } catch (err) {
      console.error('Pipeline error:', err)
      stopTimer()
      setState('error')
    }
  }, [state, bitrate, priority])

  const showResults =
    stats !== null && transcript !== '' && state !== 'recording' && state !== 'processing'

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-background px-4 py-10 sm:py-14">
      <SignalBackground />

      <div className="relative mx-auto flex w-full max-w-2xl flex-col gap-8">
        <Header />

        <ControlPanel
          state={state}
          elapsed={elapsed}
          bitrate={bitrate}
          priority={priority}
          onToggleRecord={handleToggleRecord}
          onBitrateChange={setBitrate}
          onPriorityChange={setPriority}
        />

        {showResults && stats && (
          <>
            <TransmissionStatsCard stats={stats} />
            <TranscriptionDisplay text={transcript} />
            <ReceivedAudio audioKey={audioKey} apiBase={API_BASE} />
          </>
        )}

        <FooterInfo language={language} onLanguageChange={setLanguage} />

        <p className="text-center text-xs text-muted-foreground/70">
          {BITRATE_OPTIONS.find((b) => b.mode === bitrate)?.label} link ·{' '}
          {priority === 'emergency' ? 'Emergency priority' : 'Normal priority'} · Live pipeline
        </p>
      </div>
    </main>
  )
}