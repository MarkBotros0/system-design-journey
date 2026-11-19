import { useState } from 'react'
import { Bookmark, Flame, Layers, Search } from 'lucide-react'
import { Button, ButtonLink, IconButton } from '../../components/ui/Button'
import { Chip, ChipRow } from '../../components/ui/Chip'
import { Segmented } from '../../components/ui/Segmented'
import { Sheet } from '../../components/ui/Sheet'
import { PageTitle, TopBar } from '../../components/ui/TopBar'
import { Badge, Empty, Eyebrow, Meter, Panel } from '../../components/ui/Bits'
import { ProgressRing } from '../../components/ui/ProgressRing'
import { Cell, Group } from '../../components/ui/List'
import { StatTile } from '../../components/ui/StatTile'
import { SegmentedProgress } from '../../components/ui/SegmentedProgress'
import { RouteRibbon } from '../../components/ui/RouteRibbon'
import { TrackChip, TrackGlyph } from '../../components/ui/TrackIcon'
import { trackStyle } from '../../components/ui/trackStyle'
import { SearchPill } from '../../components/ui/SearchPill'

const TRACKS = ['foundations', 'principles', 'design-patterns', 'lld', 'core', 'databases', 'distributed', 'architecture', 'production', 'applied', 'interview']

/** DEV only: every primitive of the design system, in its states, for checking by eye and by the UI audit. */
export function UiFixture() {
  const [seg, setSeg] = useState<'a' | 'b' | 'c'>('a')
  const [chip, setChip] = useState('Easy')
  const [sheet, setSheet] = useState<'medium' | 'large' | null>(null)

  return (
    <>
      <TopBar title="Design system" back={{ label: 'Home', to: '/' }} right={<IconButton label="Bookmark"><Bookmark size={18} aria-hidden="true" /></IconButton>} />
      <PageTitle title="Design system" eyebrow="Thursday 19 November" sub="Every primitive, in its states." />

      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <Eyebrow>Buttons</Eyebrow>
          <Button size="lg">Start questions</Button>
          <div className="flex flex-wrap gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Reset</Button>
            <ButtonLink to="/" variant="secondary">A link</ButtonLink>
            <IconButton label="Search"><Search size={18} aria-hidden="true" /></IconButton>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <Eyebrow>Search, chips and switches</Eyebrow>
          <SearchPill />
          <ChipRow label="Difficulty">
            {['Easy', 'Medium', 'Hard', 'New', 'Attempted', 'Software design principles'].map((c) => (
              <Chip key={c} active={chip === c} pressed={chip === c} onClick={() => setChip(c)}>
                {c}
              </Chip>
            ))}
          </ChipRow>
          <Segmented label="Example" value={seg} onChange={setSeg} options={[{ value: 'a', label: 'Your route' }, { value: 'b', label: 'All topics' }, { value: 'c', label: 'Bookmarks' }]} />
        </section>

        <section className="flex flex-col gap-3">
          <Eyebrow>Track identity</Eyebrow>
          <div className="flex flex-wrap gap-2">
            {TRACKS.map((t) => (
              <TrackGlyph key={t} trackId={t} size={44} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <TrackChip trackId="databases" label="Databases in depth" />
            <TrackChip trackId="principles" label="Software design principles" />
          </div>
          <RouteRibbon segments={TRACKS.map((t, i) => ({ trackId: t, total: 4 + (i % 5), done: i < 3 ? 4 + (i % 5) : i === 3 ? 2 : 0 }))} />
        </section>

        <section className="flex flex-col gap-3">
          <Eyebrow>Stats and progress</Eyebrow>
          <div className="grid grid-cols-3 gap-2.5">
            <StatTile to="/questions" label="Questions" value="0/10" sub="today" />
            <StatTile to="/review" label="Cards" value="27" sub="due" icon={<Layers size={16} aria-hidden="true" />} />
            <StatTile to="/you" label="Streak" value="2" sub="days" tone="streak" icon={<Flame size={16} aria-hidden="true" />} />
          </div>
          <SegmentedProgress total={10} done={3} states={['correct', 'correct', 'wrong']} label="Question 4 of 10" />
          <Meter value={0.4} label="Example" />
          <div className="flex items-center gap-3" style={trackStyle('core')}>
            <ProgressRing value={0.3} size={28} label="Track" tone="track" />
            <ProgressRing value={0.6} size={40} label="Line" />
            <ProgressRing value={1} size={56} label="Done" tone="correct" />
            <ProgressRing value={1} size={72} label="Mastered" tone="mastered" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>neutral</Badge>
            <Badge tone="correct">done</Badge>
            <Badge tone="streak">medium</Badge>
            <Badge tone="alert">hard</Badge>
            <Badge tone="mastered">Mastered</Badge>
          </div>
        </section>

        <Group title="Grouped list" action={<span className="text-[0.9375rem] font-semibold text-ink-2">Change</span>} footer="Rows are links, buttons or plain.">
          <Cell to="/learn/core" leading={<TrackGlyph trackId="core" />} title="Core system design" sub="3 of 11 passed" trailing={<span style={trackStyle('core')}><ProgressRing value={0.27} size={28} label="Core" tone="track" /></span>} />
          <Cell onClick={() => setSheet('large')} leading={<TrackGlyph trackId="principles" />} title="Software design principles — a deliberately long name that has to wrap" sub="Opens a large sheet" />
          <Cell title="Plain row" sub="No action" trailing="12" />
        </Group>

        <Panel>
          <p className="font-bold">A panel</p>
          <p className="mt-1 text-ink-2">Filled surface, soft shadow, no outline.</p>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => setSheet('medium')}>Medium sheet</Button>
            <Button variant="secondary" onClick={() => setSheet('large')}>Large sheet</Button>
          </div>
        </Panel>

        <Empty title="Nothing due" body="Cards come back as their spacing runs out. Read a lesson to add more." />
      </div>

      <Sheet open={sheet !== null} onClose={() => setSheet(null)} labelledBy="fixture-sheet" detent={sheet ?? 'large'}>
        <div className="px-5 pt-1 pb-5">
          <h2 id="fixture-sheet" className="pr-12 text-[1.25rem] font-bold">
            Contents
          </h2>
          <ol className="mt-3 flex flex-col">
            {Array.from({ length: 12 }, (_, i) => (
              <li key={i}>
                <button type="button" className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 text-left hover:bg-surface-2">
                  <span className="w-6 text-[0.875rem] font-semibold text-ink-3 tabular">{i + 1}</span>
                  <span className="font-semibold">Section {i + 1} with a reasonably long heading</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </Sheet>
    </>
  )
}
