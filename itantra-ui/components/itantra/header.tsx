import { RadioTower } from 'lucide-react'

export function Header() {
  return (
    <header className="flex flex-col items-center text-center">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium tracking-wide text-muted-foreground backdrop-blur">
        <RadioTower className="size-3.5 text-accent" aria-hidden="true" />
        SIH26173 · Emergency Voice Communication
      </div>

      <h1 className="font-serif text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
        iTantra
      </h1>

      <p className="mt-3 text-pretty text-sm font-medium text-accent/90 sm:text-base">
        Speech{' '}
        <span className="text-muted-foreground" aria-hidden="true">
          →
        </span>{' '}
        Text{' '}
        <span className="text-muted-foreground" aria-hidden="true">
          →
        </span>{' '}
        Low-Bitrate Link{' '}
        <span className="text-muted-foreground" aria-hidden="true">
          →
        </span>{' '}
        Speech
      </p>
    </header>
  )
}
