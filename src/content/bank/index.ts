import { getModule, getTrack, modules } from '../index'
import { glossary } from '../glossary'
import { patterns } from '../patterns'
import type { Question } from '../types'
import { headingSlugs } from '../../lib/slug'
import { plainText } from '../../lib/text'
import { authoredQuestions } from './authored'
import { generatedQuestions } from './generated'

/** Each lesson's quiz items, offered in the bank as single-choice questions. */
const fromQuizzes: Question[] = modules.flatMap((m) =>
  m.quiz.map(
    (item): Question => ({
      id: `quiz:${item.id}`,
      kind: 'single',
      moduleId: m.id,
      prompt: item.stem,
      options: item.options,
      correct: item.correct,
      explain: item.explain,
    }),
  ),
)

export const bank: Question[] = [...authoredQuestions, ...fromQuizzes, ...generatedQuestions(glossary, patterns)]

const byId = new Map(bank.map((q) => [q.id, q]))
export function getQuestion(id: string): Question | undefined {
  return byId.get(id)
}

export interface QuestionTopic {
  title: string
  /** The lesson's track, when the question tests a lesson. */
  trackId?: string
  trackTitle?: string
  /** Where "Learn more" goes: the lesson section, the glossary entry, or the pattern. */
  href: string
}

export function questionTopic(q: Question): QuestionTopic {
  const m = q.moduleId ? getModule(q.moduleId) : undefined
  if (!m) return { title: q.topic?.title ?? 'Throughput', href: q.topic?.href ?? '/learn' }
  let href = `/m/${m.id}`
  if (q.section) {
    const want = plainText(q.section).trim()
    for (const [i, slug] of headingSlugs(m.lesson)) {
      const b = m.lesson[i]
      if (b.kind === 'heading' && plainText(b.text).trim() === want) {
        href += `#${slug}`
        break
      }
    }
  }
  return { title: plainText(m.title), trackId: m.trackId, trackTitle: getTrack(m.trackId)?.title, href }
}
