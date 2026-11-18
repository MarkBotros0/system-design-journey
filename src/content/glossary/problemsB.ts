import type { GlossaryEntry } from '../glossary'

/** Glossary entries added by the problemsB content author. Same shape and rules as glossary.ts. */
export const terms: GlossaryEntry[] = [
  {
    id: 'APNs',
    full: 'Apple Push Notification service',
    gist: "Apple's gateway for push notifications to iPhones and Macs. Your server never reaches the phone itself: it hands Apple a message and a device token, and Apple owns the last hop.",
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'Your push worker', sub: 'message + device token', to: 'HTTP/2' },
        { label: 'APNs', sub: "Apple's gateway", tone: 'line', to: 'when the phone is reachable' },
        { label: 'iPhone', sub: 'shows the notification', tone: 'mastered' },
      ],
      note: 'An accepted request means Apple has it, not that the user has seen it.',
    },
    caption: 'You deliver to Apple; Apple delivers to the device.',
    seeAlso: ['FCM'],
  },
  {
    id: 'FCM',
    full: 'Firebase Cloud Messaging',
    gist: "Google's push gateway for Android apps, which can also relay to iOS and the web. Same contract as Apple's: one token per app install, and a token that goes stale the moment the app is uninstalled.",
    figure: {
      kind: 'split',
      left: {
        title: 'App still installed',
        tone: 'mastered',
        nodes: [
          { label: 'Send with token', to: 'accepted' },
          { label: 'Device shows it', tone: 'mastered' },
        ],
        cost: 'The normal path.',
      },
      right: {
        title: 'App uninstalled',
        tone: 'alert',
        nodes: [
          { label: 'Send with token', to: 'unregistered' },
          { label: 'Delete the token', tone: 'alert' },
        ],
        cost: 'Keep sending to dead tokens and you pay for every one of them.',
      },
    },
    caption: 'A device token is only good while the app is installed. The error on send is your signal to forget it.',
    seeAlso: ['APNs'],
  },
  {
    id: 'ETA',
    full: 'Estimated time of arrival',
    gist: 'When something is predicted to arrive. In delivery design it is a sum of estimates (preparation, pickup, travel), each with its own error, which is why a good one is shown as a range and recomputed at every event.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'Prep', sub: '16 min, give or take 4', to: '+' },
        { label: 'Pickup', sub: '2 min', to: '+' },
        { label: 'Drive', sub: '12 min, give or take 3', to: '=' },
        { label: '25–35 min', sub: 'shown as a range', tone: 'line' },
      ],
    },
    caption: 'An arrival estimate is several estimates added up, so their uncertainty adds up too.',
  },
  {
    id: '2PC',
    full: 'Two-phase commit',
    gist: "A protocol that makes several databases commit together: a coordinator asks every participant to prepare, and only when all vote yes tells them to commit. Correct, but participants hold locks while they wait, and only systems that speak the protocol can take part. A payment provider's public API does not.",
    figure: {
      kind: 'sequence',
      actors: ['Coordinator', 'Orders DB', 'Payments DB'],
      steps: [
        { from: 0, to: 1, label: 'prepare' },
        { from: 0, to: 2, label: 'prepare' },
        { from: 1, to: 0, label: 'yes', dashed: true },
        { from: 2, to: 0, label: 'yes', dashed: true },
        { from: 0, to: 0, label: 'decision logged' },
        { from: 0, to: 1, label: 'commit', tone: 'mastered' },
        { from: 0, to: 2, label: 'commit', tone: 'mastered' },
      ],
      note: 'If the coordinator dies after prepare, both databases wait, holding their locks.',
    },
    caption: 'Nobody commits until everyone has voted yes, and everyone waits on the coordinator.',
    seeAlso: ['ACID'],
  },
]
