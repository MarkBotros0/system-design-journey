import type { Track } from './types'

/**
 * Eleven tracks, in journey order: the design of code first (principles, patterns,
 * low-level design), then the system design survey, then its deep dives, then the
 * applied patterns and the room itself. Deep tracks sit after the survey they deepen,
 * so "builds on" always points backwards.
 *
 * `moduleIds` is derived at load time in index.ts rather than duplicated here. Tracks
 * with no modules yet are hidden by `populatedTracks`.
 */
export const tracks: Omit<Track, 'moduleIds'>[] = [
  {
    id: 'foundations',
    code: 'F',
    title: 'Foundations',
    blurb: 'The vocabulary. By the end you can read any architecture diagram and know what every box is for.',
    outcomes: [
      'Explain what happens between a tap and a response',
      'Sketch an API and pick a database for it',
      'Say where caching and scaling help, and what they cost',
    ],
  },
  {
    id: 'principles',
    code: 'P',
    title: 'Software design principles',
    blurb: 'SOLID and the ideas behind it — how to shape code so it survives the next requirement.',
    outcomes: [
      'Spot a SOLID violation in real code and fix it',
      'Argue coupling and cohesion trade-offs out loud',
      'Lay out a service with clean or hexagonal boundaries',
    ],
  },
  {
    id: 'design-patterns',
    code: 'DP',
    title: 'Design patterns',
    blurb: 'The named solutions interviewers expect you to reach for — and the judgement to know when not to.',
    outcomes: [
      'Recognise which pattern a problem is asking for',
      'Sketch the classes of any common pattern from memory',
      'Name the cost of a pattern before you use it',
    ],
  },
  {
    id: 'lld',
    code: 'L',
    title: 'Low-level design',
    blurb: 'The object-oriented design round: from a vague prompt to classes, methods, and thread-safe code.',
    outcomes: [
      'Run a low-level design interview end to end',
      'Model objects, responsibilities and relationships',
      'Make a design extensible and safe under concurrency',
    ],
  },
  {
    id: 'core',
    code: 'C',
    title: 'Core system design',
    blurb: 'The framework, and the trade-offs every design turns on. This is the track that changes how you answer.',
    outcomes: [
      'Run the 45-minute delivery framework',
      'Estimate, model data, cache, and shard with reasons',
      'Reason about consistency, queues and search',
    ],
  },
  {
    id: 'databases',
    code: 'DB',
    title: 'Databases in depth',
    blurb: 'ACID, isolation, storage engines and schema design — the questions that separate senior answers from the rest.',
    outcomes: [
      'Model a schema and normalise it — or justify not doing so',
      'Name the anomaly each isolation level allows',
      'Choose a database and defend it',
    ],
  },
  {
    id: 'distributed',
    code: 'D',
    title: 'Distributed systems',
    blurb: 'What changes when the pieces live on different machines: failure, consensus, time, and transactions.',
    outcomes: [
      'Design for partial failure instead of hoping it away',
      'Pick a consistency model and a delivery guarantee',
      'Coordinate work across services without 2-phase pain',
    ],
  },
  {
    id: 'architecture',
    code: 'AR',
    title: 'Architecture & APIs',
    blurb: 'Monoliths, microservices, events, and the API contracts that hold them together.',
    outcomes: [
      'Argue monolith vs microservices for a given team',
      'Design an event-driven flow and its failure modes',
      'Design a production-grade API: pagination, versioning, errors',
    ],
  },
  {
    id: 'production',
    code: 'O',
    title: 'Production readiness',
    blurb: 'Observability, reliability targets, security and safe releases — what senior engineers are trusted with.',
    outcomes: [
      'Define SLOs and instrument a service to meet them',
      'Choose an authentication and authorization scheme',
      'Ship changes safely and roll them back',
    ],
  },
  {
    id: 'applied',
    code: 'A',
    title: 'Applied patterns',
    blurb: 'Eight shapes that cover most questions. Recognise the shape and most of the design is recall.',
    outcomes: [
      'Recognise the pattern behind an unfamiliar question',
      'Apply the standard move for each shape',
      'Own the costs each move creates',
    ],
  },
  {
    id: 'interview',
    code: 'I',
    title: 'The interview',
    blurb: 'The difference between knowing this and performing it under a clock with someone watching.',
    outcomes: [
      'Run the room in a design round',
      'Tell behavioral stories that show senior scope',
      'Handle a question you have never seen',
    ],
  },
]
