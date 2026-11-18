import type { Difficulty, Module, Problem, ProblemKind, Route, RouteStop } from './types'

/**
 * Routes — ordered paths through the curriculum, with problems as checkpoints.
 *
 * Nothing is locked; a route only decides what "next" means. Specs here are pure
 * functions of the content so this file imports nothing from index.ts (which imports
 * this one). Ids that do not exist yet are filtered out, so a route stays valid while
 * a track is still being written and fills in as it lands.
 */

interface Ctx {
  modules: Module[]
  problems: Problem[]
  trackOrder: string[]
}

interface RouteSpec {
  id: string
  title: string
  blurb: string
  build: (ctx: Ctx) => RouteStop[]
}

/** Problems placed on the full journey right after the track they test. */
export const CHECKPOINTS: Record<string, string[]> = {
  lld: ['lld-parking-lot', 'lld-lru'],
  core: ['bitly', 'ticketmaster', 'news-feed'],
  databases: ['airbnb'],
  distributed: ['payments', 'kv-store'],
  architecture: ['notifications'],
  applied: ['whatsapp', 'uber', 'youtube', 'instagram'],
}

const DIFFICULTY_ORDER: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 }

const m = (id: string): RouteStop => ({ module: id })
const p = (id: string): RouteStop => ({ problem: id })

function trackModules(ctx: Ctx, trackId: string): RouteStop[] {
  return ctx.modules
    .filter((x) => x.trackId === trackId)
    .sort((a, b) => a.station - b.station)
    .map((x) => m(x.id))
}

function problemsOfKind(ctx: Ctx, kind: ProblemKind): RouteStop[] {
  return ctx.problems
    .map((x, i) => ({ x, i }))
    .filter(({ x }) => x.kind === kind)
    .sort((a, b) => DIFFICULTY_ORDER[a.x.difficulty] - DIFFICULTY_ORDER[b.x.difficulty] || a.i - b.i)
    .map(({ x }) => p(x.id))
}

const SPECS: RouteSpec[] = [
  {
    id: 'full',
    title: 'Full journey',
    blurb: 'Every track in order, from the vocabulary to running the room. The complete senior preparation.',
    build: (ctx) =>
      ctx.trackOrder.flatMap((t) => [...trackModules(ctx, t), ...(CHECKPOINTS[t] ?? []).map(p)]),
  },
  {
    id: 'two-weeks',
    title: 'Interview in 2 weeks',
    blurb: 'The highest-yield lessons and four famous problems. Two or three stops a day.',
    build: () => [
      ...['f-what', 'f-network', 'f-api', 'f-db', 'f-cache', 'f-scale'].map(m),
      ...['p-srp-ocp', 'p-dip', 'dp-intro', 'dp-strategy-state', 'dp-observer'].map(m),
      ...['c-framework', 'c-requirements', 'c-modelling', 'c-caching', 'c-sharding'].map(m),
      p('bitly'),
      ...['c-cap', 'c-queues', 'db-acid', 'db-isolation', 'd-transactions', 'd-delivery'].map(m),
      ...['a-realtime', 'a-contention'].map(m),
      p('ticketmaster'),
      ...['a-reads', 'a-writes'].map(m),
      p('uber'),
      p('instagram'),
      ...['i-room', 'i-star'].map(m),
    ],
  },
  {
    id: 'system-design',
    title: 'System design round',
    blurb: 'Foundations, the core trade-offs, the deep dives that come up most, and every famous design question.',
    build: (ctx) => [
      ...trackModules(ctx, 'foundations'),
      ...trackModules(ctx, 'core'),
      ...['db-acid', 'db-isolation', 'db-replication', 'db-choosing'].map(m),
      ...['d-consistency', 'd-transactions', 'd-delivery', 'd-resilience'].map(m),
      ...['ar-events', 'ar-api'].map(m),
      ...trackModules(ctx, 'applied'),
      ...['i-room', 'i-recognition'].map(m),
      ...problemsOfKind(ctx, 'hld'),
    ],
  },
  {
    id: 'lld',
    title: 'OOP & low-level design round',
    blurb: 'Principles, patterns and the object-oriented design round, with the schema questions that come with it.',
    build: (ctx) => [
      ...trackModules(ctx, 'principles'),
      ...trackModules(ctx, 'design-patterns'),
      ...trackModules(ctx, 'lld'),
      ...['db-er', 'db-normalization', 'db-acid'].map(m),
      ...problemsOfKind(ctx, 'lld'),
    ],
  },
  {
    id: 'databases',
    title: 'Databases deep dive',
    blurb: 'From picking a store to isolation levels and replication — the questions that sink senior candidates.',
    build: (ctx) => [
      ...['f-db', 'f-storage', 'c-modelling', 'c-sharding', 'c-cap'].map(m),
      ...trackModules(ctx, 'databases'),
      m('d-transactions'),
      p('airbnb'),
      p('kv-store'),
    ],
  },
  {
    id: 'behavioral',
    title: 'Behavioral round',
    blurb: 'How seniors are judged on stories: scope, influence, conflict, failure.',
    build: () => ['f-what', 'i-room', 'i-star', 'i-influence', 'i-failure'].map(m),
  },
]

/** Builds every route against the content that actually exists, dropping missing ids. */
export function buildRoutes(ctx: Ctx): Route[] {
  const moduleIds = new Set(ctx.modules.map((x) => x.id))
  const problemIds = new Set(ctx.problems.map((x) => x.id))
  const exists = (s: RouteStop) => ('module' in s ? moduleIds.has(s.module) : problemIds.has(s.problem))
  return SPECS.map(({ id, title, blurb, build }) => ({ id, title, blurb, stops: build(ctx).filter(exists) }))
}

/**
 * The three rounds a senior loop usually has. Readiness for each is measured against its
 * route's lessons plus, for design rounds, problems attempted (`target` is how many
 * well-done problems count as fully ready).
 */
export const ROUNDS: {
  id: 'system-design' | 'lld' | 'behavioral'
  title: string
  routeId: string
  problemKind?: ProblemKind
  target: number
}[] = [
  { id: 'system-design', title: 'System design', routeId: 'system-design', problemKind: 'hld', target: 8 },
  { id: 'lld', title: 'OOP / low-level design', routeId: 'lld', problemKind: 'lld', target: 4 },
  { id: 'behavioral', title: 'Behavioral', routeId: 'behavioral', target: 0 },
]
