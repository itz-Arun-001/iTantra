import { FileText, Quote } from 'lucide-react'

export function TranscriptionDisplay({ text }: { text: string }) {
  return (
    <section
      className="itantra-rise rounded-2xl border border-border bg-card/80 p-6 shadow-2xl backdrop-blur-sm sm:p-8"
      aria-label="Transcribed message"
    >
      <div className="mb-3 flex items-center gap-2">
        <FileText className="size-4 text-accent" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-foreground">Transcribed</h2>
        <span className="text-xs text-muted-foreground">
          — this is what gets transmitted, not audio
        </span>
      </div>

      <blockquote className="relative rounded-xl border border-accent/25 bg-accent/5 p-5 pl-6">
        <Quote
          className="absolute -left-2 -top-2 size-6 rounded-full bg-card p-1 text-accent"
          aria-hidden="true"
        />
        <p className="text-pretty text-base leading-relaxed text-foreground">
          {text}
        </p>
      </blockquote>

      <p className="mt-3 text-right font-mono text-xs text-muted-foreground">
        {new Blob([text]).size} bytes payload
      </p>
    </section>
  )
}
