import { isDecisionNode, type DecisionLeaf, type DecisionNode, type Figure } from '../../content/figures'
import { Frame } from './figureKit'
import { boxTone, neutralCell } from './figureTones'
import { Inline } from './Inline'

/**
 * A yes/no tree, drawn as indented branches rather than a fanned-out diagram: on a phone
 * a tree only stays legible if it grows downwards. The Yes/No label sits above each
 * branch so the indentation per level stays small. The branch rule is the tree itself,
 * so it is the one line kept.
 */
function Node({ node }: { node: DecisionNode | DecisionLeaf }) {
  if (!isDecisionNode(node)) {
    return (
      <div className={`rounded-xl px-3.5 py-2.5 ${boxTone[node.tone ?? 'neutral']}`}>
        <p className="text-[0.875rem] leading-snug font-bold">
          <Inline text={node.answer} />
        </p>
        {node.sub && (
          <p className="mt-0.5 text-[0.8125rem] leading-snug text-ink-2">
            <Inline text={node.sub} />
          </p>
        )}
      </div>
    )
  }
  return (
    <div>
      <p className={`rounded-xl px-3.5 py-2.5 text-[0.875rem] leading-snug font-semibold ${neutralCell}`}>
        <Inline text={node.question} />
      </p>
      <div className="mt-2 ml-3 flex flex-col gap-2.5 border-l-2 border-surface-3 pl-3.5">
        {(['yes', 'no'] as const).map((side) => (
          <div key={side}>
            <span className="mb-1 inline-block text-[0.8125rem] font-bold text-ink-2">
              {side === 'yes' ? 'Yes' : 'No'}
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
