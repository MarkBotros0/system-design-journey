import type { Track } from './types'

/**
 * Four tracks, in order. `moduleIds` is derived at load time in index.ts rather than
 * duplicated here — one list to keep in sync instead of two.
 */
export const tracks: Omit<Track, 'moduleIds'>[] = [
  {
    id: 'foundations',
    level: 'foundations',
    title: 'Foundations',
    blurb: 'The vocabulary. By the end you can read any architecture diagram and know what every box is for.',
  },
  {
    id: 'core',
    level: 'core',
    title: 'Core concepts',
    blurb: 'The framework, and the trade-offs every design turns on. This is the track that changes how you answer.',
  },
  {
    id: 'applied',
    level: 'applied',
    title: 'Applied patterns',
    blurb: 'Eight shapes that cover most questions. Recognise the shape and most of the design is recall.',
  },
  {
    id: 'interview',
    level: 'interview',
    title: 'Running the room',
    blurb: 'The difference between knowing this and performing it under a clock with someone watching.',
  },
]
