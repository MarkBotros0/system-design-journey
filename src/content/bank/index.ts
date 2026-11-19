import { getModule, getTrack, modules } from '../index'
import { glossary } from '../glossary'
import { patterns } from '../patterns'
import type { Question } from '../types'
import { headingSlugs } from '../../lib/slug'
import { plainText } from '../../lib/text'
import { authoredQuestions } from './authored'
import { generatedQuestions } from './generated'
import { unwrappedTerms } from '../validate'

/** Wraps the first plain mention of `term` (outside code and existing [[…]]), or returns null. */
export function wrapFirst(text: string, term: string): string | null {
  const parts = text.split(/(`[^`]*`|\[\[[^\]]+\]\])/)
  const re = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(s?)\\b`)
  for (let i = 0; i < parts.length; i += 2) {
    const m = re.exec(parts[i])
    if (!m) continue
    const wrapped = m[1] ? `[[${term}|${term}${m[1]}]]` : `[[${term}]]`
    parts[i] = parts[i].slice(0, m.index) + wrapped + parts[i].slice(m.index + m[0].length)
    return parts.join('')
  }
  return null
}

/**
 * Each lesson's quiz items, offered in the bank as single-choice questions. In the lesson,
 * an abbreviation is explained once per lesson; here each question is read alone, so any
 * term it shows is wrapped at its first mention in the prompt or explanation.
 */
const fromQuizzes: Question[] = modules.flatMap((m) =>
  m.quiz.map((item): Question => {
    let prompt = item.stem
    let explain = item.explain
    for (const term of unwrappedTerms([prompt, explain], item.options)) {
      const p = wrapFirst(prompt, term)
      if (p) prompt = p
      else explain = wrapFirst(explain, term) ?? explain
    }
    return { id: `quiz:${item.id}`, kind: 'single', moduleId: m.id, prompt, options: item.options, correct: item.correct, explain }
  }),
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
  if (!m) return { title: q.topic?.title ?? 'Senior Loop', href: q.topic?.href ?? '/learn' }
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
