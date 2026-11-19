import { getTrack } from '../../content'
import type { Module } from '../../content/types'
import { plainText } from '../../lib/text'
import { Cell, Group } from '../ui/List'
import { TrackGlyph } from '../ui/TrackIcon'

/** Lessons that pair with this one, across tracks: a grouped list, each led by its track's glyph. */
export function RelatedRow({ modules }: { modules: Module[] }) {
  if (!modules.length) return null
  return (
    <Group title="Goes well with" className="mt-10">
      {modules.map((m) => (
        <Cell
          key={m.id}
          to={`/m/${m.id}`}
          leading={<TrackGlyph trackId={m.trackId} size={36} />}
          title={plainText(m.title)}
          sub={`${getTrack(m.trackId)?.title ?? ''} · ${m.minutes} min`}
        />
      ))}
    </Group>
  )
}
