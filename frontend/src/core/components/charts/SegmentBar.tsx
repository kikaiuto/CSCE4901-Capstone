import { Figure } from '@/core/components/ui/Figure'

export interface Segment {
  key: string
  label: string
  value: string
  share: number
  color: string
}

export interface SegmentBarProps {
  segments: Segment[]
  caption: string
}

export function SegmentBar({ segments, caption }: SegmentBarProps) {
  return (
    <div>
      <div
        className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-pill"
        role="img"
        aria-label={caption}
      >
        {segments.map((segment) => (
          <span
            key={segment.key}
            style={{ width: `${segment.share}%`, backgroundColor: segment.color }}
          />
        ))}
      </div>

      <dl className="mt-4 flex flex-col">
        {segments.map((segment) => (
          <div
            key={segment.key}
            className="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0"
          >
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-[2px]"
              style={{ backgroundColor: segment.color }}
            />
            <dt className="flex-1 text-base text-ink-muted">{segment.label}</dt>
            <dd className="flex items-baseline gap-3">
              <Figure value={segment.value} />
              <span className="figure w-9 text-right text-xs text-ink-faint">
                {segment.share}%
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
