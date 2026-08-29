'use client'

import { AlertTriangle, Check, Loader2, Mic, Radio, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  BITRATE_OPTIONS,
  type BitrateMode,
  type Priority,
  type RecorderState,
} from './types'

const STATUS_TEXT: Record<RecorderState, string> = {
  idle: 'Ready to record',
  recording: 'Listening…',
  processing: 'Processing speech…',
  transmitting: 'Transmitting over link…',
  success: 'Transmission complete',
  error: 'Transmission failed — retry',
}

interface ControlPanelProps {
  state: RecorderState
  elapsed: number
  bitrate: BitrateMode
  priority: Priority
  onToggleRecord: () => void
  onBitrateChange: (mode: BitrateMode) => void
  onPriorityChange: (priority: Priority) => void
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, '0')
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, '0')
  return `${m}:${s}`
}

export function ControlPanel({
  state,
  elapsed,
  bitrate,
  priority,
  onToggleRecord,
  onBitrateChange,
  onPriorityChange,
}: ControlPanelProps) {
  const isEmergency = priority === 'emergency'
  const isRecording = state === 'recording'
  const isBusy = state === 'processing' || state === 'transmitting'

  return (
    <section
      className={cn(
        'relative rounded-2xl border bg-card/80 p-6 shadow-2xl backdrop-blur-sm sm:p-8',
        isEmergency ? 'border-emergency/50' : 'border-border',
      )}
      aria-label="Recording controls"
    >
      {/* Mic button */}
      <div className="flex flex-col items-center">
        <div className="relative flex h-40 w-40 items-center justify-center">
          {/* Recording concentric rings */}
          {isRecording &&
            [0, 0.6].map((delay) => (
              <span
                key={delay}
                aria-hidden="true"
                className={cn(
                  'itantra-ring absolute h-32 w-32 rounded-full border-2',
                  isEmergency ? 'border-emergency/60' : 'border-primary/60',
                )}
                style={{ animationDelay: `${delay}s` }}
              />
            ))}

          <button
            type="button"
            onClick={onToggleRecord}
            disabled={isBusy}
            aria-pressed={isRecording}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            className={cn(
              'relative flex h-32 w-32 items-center justify-center rounded-full text-primary-foreground transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/50 disabled:cursor-not-allowed',
              state === 'error' && 'itantra-shake',
              state === 'success' && 'itantra-flash',
              isEmergency
                ? 'bg-emergency ring-emergency/40'
                : 'bg-primary ring-primary/40',
              state === 'idle' &&
                (isEmergency
                  ? 'itantra-idle-glow-emergency hover:brightness-110'
                  : 'itantra-idle-glow hover:brightness-110'),
              isRecording && 'scale-105 shadow-lg',
            )}
          >
            {state === 'idle' && <Mic className="size-12" aria-hidden="true" />}
            {isRecording && <Square className="size-10 fill-current" aria-hidden="true" />}
            {isBusy && <Loader2 className="size-12 animate-spin" aria-hidden="true" />}
            {state === 'success' && <Check className="size-14" aria-hidden="true" />}
            {state === 'error' && (
              <AlertTriangle className="size-12" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Waveform + timer while recording */}
        {isRecording ? (
          <div className="mt-5 flex items-center gap-3">
            <div className="flex h-6 items-end gap-1" aria-hidden="true">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <span
                  key={i}
                  className={cn(
                    'itantra-bar w-1 rounded-full',
                    isEmergency ? 'bg-emergency' : 'bg-accent',
                  )}
                  style={{
                    height: '100%',
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
            <span className="font-mono text-sm tabular-nums text-foreground">
              {formatTime(elapsed)}
            </span>
          </div>
        ) : (
          <p
            className={cn(
              'mt-5 flex items-center gap-2 text-sm font-medium',
              state === 'error' ? 'text-emergency' : 'text-muted-foreground',
              state === 'success' && 'text-success',
            )}
            aria-live="polite"
          >
            {(state === 'processing' || state === 'transmitting') && (
              <Radio className="size-4 animate-pulse text-accent" aria-hidden="true" />
            )}
            {STATUS_TEXT[state]}
          </p>
        )}
      </div>

      {/* Bitrate selector */}
      <div className="mt-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Link bitrate
        </p>
        <div
          className="grid grid-cols-4 gap-1.5 rounded-xl border border-border bg-background/50 p-1.5"
          role="group"
          aria-label="Bitrate mode"
        >
          {BITRATE_OPTIONS.map((opt) => {
            const active = bitrate === opt.mode
            return (
              <button
                key={opt.mode}
                type="button"
                onClick={() => onBitrateChange(opt.mode)}
                aria-pressed={active}
                className={cn(
                  'flex flex-col items-center rounded-lg px-2 py-2 text-center transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'text-muted-foreground hover:bg-card hover:text-foreground',
                )}
              >
                <span className="text-xs font-bold tracking-wide">{opt.mode}</span>
                <span
                  className={cn(
                    'text-[10px] tabular-nums',
                    active ? 'text-primary-foreground/80' : 'text-muted-foreground/70',
                  )}
                >
                  {opt.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Priority toggle */}
      <div className="mt-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Priority
        </p>
        <div
          className="grid grid-cols-2 gap-1.5 rounded-xl border border-border bg-background/50 p-1.5"
          role="group"
          aria-label="Message priority"
        >
          <button
            type="button"
            onClick={() => onPriorityChange('normal')}
            aria-pressed={priority === 'normal'}
            className={cn(
              'rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
              priority === 'normal'
                ? 'bg-secondary text-secondary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Normal
          </button>
          <button
            type="button"
            onClick={() => onPriorityChange('emergency')}
            aria-pressed={priority === 'emergency'}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
              priority === 'emergency'
                ? 'bg-emergency text-emergency-foreground shadow'
                : 'text-emergency/80 hover:text-emergency',
            )}
          >
            <AlertTriangle className="size-4" aria-hidden="true" />
            Emergency
          </button>
        </div>
      </div>
    </section>
  )
}
