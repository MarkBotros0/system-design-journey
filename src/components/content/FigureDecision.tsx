import { isDecisionNode, type DecisionLeaf, type DecisionNode, type Figure } from '../../content/figures'
import { Frame } from './figureKit'
import { boxTone } from './figureTones'
import { Inline } from './Inline'

/**
 * A yes/no tree, drawn as indented branches rather than a fanned-out diagram: on a phone
 * a tree only stays legible if it grows downwards. The Yes/No label sits above each
 * branch so the indentation per level stays small.
 */
function Node({ node }: { node: DecisionNode | DecisionLeaf }) {
  if (!isDecisionNode(node)) {
    return (
      <div className={`rounded-lg border px-3 py-2 ${boxTone[node.tone ?? 'neutral']}`}>
        <p className="text-[0.8125rem] leading-snug font-semibold">
          <Inline text={node.answer} />
        </p>
        {node.sub && (
          <p className="mt-0.5 font-mono text-[0.6875rem] leading-snug text-ink-3">
            <Inline text={node.sub} />
          </p>
        )}
      </div>
    )
  }
  return (
    <div>
      <p className="rounded-lg border border-hairline bg-surface px-3 py-2 text-[0.8125rem] leading-snug font-medium">
        <Inline text={node.question} />
      </p>
      <div className="mt-1.5 ml-2.5 flex flex-col gap-2 border-l-2 border-hairline pl-3">
        {(['yes', 'no'] as const).map((side) => (
          <div key={side}>
            <span className="mb-1 inline-block rounded-full bg-surface-2 px-2 py-0.5 font-mono text-[0.625rem] tracking-wide text-ink-2 uppercase">
              {side}
            </span>
            <Node node={node[side]} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function DecisionFigure({ figure }: { figure: Extract<Figure, { kind: 'decision' }> }) {
  return (
    <Frame note={figure.note}>
      <Node node={figure.root} />
    </Frame>
  )
}
