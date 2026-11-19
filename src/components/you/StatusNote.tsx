import { CircleAlert, CircleCheck } from 'lucide-react'

export type StatusPlace = 'install' | 'data' | 'reset'
export interface StatusMessage {
  kind: 'ok' | 'error'
  text: string
  /** Which control it answers — the note appears under that one, where the eye already is. */
  at: StatusPlace
}

/**
 * The answer to an action on the You screen. The live region is always mounted, so a
 * screen reader hears the message the moment it is filled; it is empty otherwise. An
 * outcome always carries its icon as well as its tint.
 */
export function StatusNote({ message, at }: { message: StatusMessage | null; at: StatusPlace }) {
  const shown = message?.at === at ? message : null
  const Icon = shown?.kind === 'error' ? CircleAlert : CircleCheck
  return (
    <div role="status">
      {shown && (
        <p
          className={`mt-3 flex items-start gap-2.5 rounded-[18px] px-4 py-3 text-[0.9375rem] font-semibold ${
            shown.kind === 'ok' ? 'bg-correct-soft text-correct' : 'bg-alert-soft text-alert'
          }`}
        >
          <Icon size={18} strokeWidth={2.4} aria-hidden="true" className="mt-px shrink-0" />
          <span className="min-w-0">{shown.text}</span>
        </p>
      )}
    </div>
  )
}
