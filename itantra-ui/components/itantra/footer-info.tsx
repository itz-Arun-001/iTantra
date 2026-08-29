'use client'

import { useState } from 'react'
import { ChevronDown, Info, Languages } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LANGUAGES, type Language } from './types'

interface FooterInfoProps {
  language: Language
  onLanguageChange: (lang: Language) => void
}

const PIPELINE = [
  { step: '01', title: 'Capture', desc: 'Voice is recorded on the sender device.' },
  {
    step: '02',
    title: 'Speech → Text',
    desc: 'On-device ASR transcribes the message to compact text.',
  },
  {
    step: '03',
    title: 'Low-bitrate link',
    desc: 'Only text is sent over the constrained radio channel, with packet-loss recovery.',
  },
  {
    step: '04',
    title: 'Text → Speech',
    desc: 'The receiver re-synthesizes speech in the chosen language.',
  },
]

export function FooterInfo({ language, onLanguageChange }: FooterInfoProps) {
  const [open, setOpen] = useState(false)

  return (
    <footer className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card/60 px-5 py-4 backdrop-blur-sm">
        {/* Language selector */}
        <div className="flex items-center gap-3">
          <Languages className="size-4 text-accent" aria-hidden="true" />
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Language">
            {LANGUAGES.map((lang) => {
              const active = language === lang.code
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => onLanguageChange(lang.code)}
                  aria-pressed={active}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    active
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )}
                >
                  {lang.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* How it works toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Info className="size-4" aria-hidden="true" />
          How it works
          <ChevronDown
            className={cn('size-3.5 transition-transform', open && 'rotate-180')}
            aria-hidden="true"
          />
        </button>
      </div>

      {open && (
        <div className="itantra-rise grid gap-3 rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-sm sm:grid-cols-2 lg:grid-cols-4">
          {PIPELINE.map((p) => (
            <div key={p.step} className="rounded-xl border border-border bg-background/40 p-4">
              <span className="font-mono text-xs font-bold text-accent">{p.step}</span>
              <h3 className="mt-1 text-sm font-semibold text-foreground">{p.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      )}
    </footer>
  )
}
