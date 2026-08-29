'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, ShieldAlert, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DeliveryStatus, TransmissionStats } from './types'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

const STATUS_META: Record<
  DeliveryStatus,
  { label: string; className: string; Icon: typeof CheckCircle2 }
> = {
  delivered: {
    label: 'Delivered',
    className: 'text-success',
    Icon: CheckCircle2,
  },
  recovered: {
    label: 'Packet loss recovered',
    className: 'text-accent',
    Icon: ShieldAlert,
  },
  failed: {
    label: 'Delivery failed',
    className: 'text-emergency',
    Icon: XCircle,
  },
}

function RadialReduction({ pct }: { pct: number }) {
  const [display, setDisplay] = useState(0)
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (display / 100) * circumference

  useEffect(() => {
    const start = performance.now()
    const duration = 900
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(pct * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [pct])

  return (
    <div className="relative flex h-36 w-36 items-center justify-center">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth="8"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-mono text-3xl font-bold tabular-nums text-accent">
          {display.toFixed(1)}
          <span className="text-lg">%</span>
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          reduction
        </span>
      </div>
    </div>
  )
}

function StatTile({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-foreground">
        {value}
      </p>
      {sub ? <p className="text-[11px] text-muted-foreground">{sub}</p> : null}
    </div>
  )
}

export function TransmissionStatsCard({ stats }: { stats: TransmissionStats }) {
  const meta = STATUS_META[stats.status]

  return (
    <section
      className="itantra-rise rounded-2xl border border-border bg-card/80 p-6 shadow-2xl backdrop-blur-sm sm:p-8"
      aria-label="Live transmission statistics"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Live transmission
        </h2>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border border-border bg-background/50 px-3 py-1 text-xs font-semibold',
            meta.className,
          )}
        >
          <meta.Icon className="size-4" aria-hidden="true" />
          {meta.label}
        </span>
      </div>

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        {/* Hero radial */}
        <div className="flex shrink-0 flex-col items-center">
          <RadialReduction pct={stats.reductionPct} />
          <p className="mt-1 max-w-40 text-center text-xs text-muted-foreground text-pretty">
            bandwidth saved vs. raw audio
          </p>
        </div>

        {/* Stat tiles */}
        <div className="grid w-full grid-cols-2 gap-3">
          <StatTile label="Original" value={formatBytes(stats.originalBytes)} sub="raw audio" />
          <StatTile
            label="Transmitted"
            value={formatBytes(stats.transmittedBytes)}
            sub="text payload"
          />
          <StatTile
            label="Packets"
            value={`${stats.packetsTotal - stats.packetsLost}/${stats.packetsTotal}`}
            sub={
              stats.packetsLost > 0
                ? `${stats.packetsLost} lost · ${stats.packetsRetried} retried`
                : 'no loss'
            }
          />
          <StatTile
            label="Duration"
            value={`${stats.durationSec.toFixed(1)}s`}
            sub="captured audio"
          />
        </div>
      </div>
    </section>
  )
}
