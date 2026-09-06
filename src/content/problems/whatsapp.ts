import type { Problem } from '../types'

export const whatsapp: Problem = {
  id: 'whatsapp',
  title: 'Design WhatsApp',
  difficulty: 'medium',
  brief:
    'One-to-one and group messaging. Messages must arrive in order, survive the recipient being offline, and show delivered and read receipts.',
  patterns: ['realtime', 'scaling-writes'],
  suggests: ['a-realtime', 'c-queues'],
  rubric: [
    { id: 'r1', bar: 'must', criterion: 'Scoped to send / receive / group / receipts' },
    { id: 'r2', bar: 'must', criterion: 'Chose WebSocket and justified it over SSE for this case' },
    { id: 'r3', bar: 'must', criterion: 'Persisted messages so an offline recipient still receives them' },
    { id: 'r4', bar: 'must', criterion: 'Modelled the inbox per recipient, not just a global message log' },
    { id: 'r5', bar: 'senior', criterion: 'Explained how a message reaches the server holding the recipient connection' },
    { id: 'r6', bar: 'senior', criterion: 'Handled ordering with a per-conversation sequence, not wall-clock time' },
    { id: 'r7', bar: 'senior', criterion: 'Made delivery idempotent using a client-generated message id' },
    { id: 'r8', bar: 'senior', criterion: 'Handled reconnection with a cursor rather than assuming a stable socket' },
    { id: 'r9', bar: 'staff', criterion: 'Addressed group fan-out and why large groups need different handling' },
    { id: 'r10', bar: 'staff', criterion: 'Named the consequence of end-to-end encryption for server-side features' },
  ],
  modelAnswer: [
    { kind: 'heading', text: 'Requirements' },
    {
      kind: 'list',
      items: [
        'Send and receive one-to-one messages.',
        'Group messages, up to a few hundred members.',
        'Delivered and read receipts.',
        'Out of scope: voice, video, media (though media is just the blob pattern bolted on).',
      ],
    },
    {
      kind: 'prose',
      text: 'Non-functional: **no message may be lost**, ever — durability is the headline. Ordering within a conversation must be consistent for all participants. Sub-second delivery when both parties are online. Hundreds of millions of concurrent connections.',
    },
    { kind: 'heading', text: 'Why WebSocket here' },
    {
      kind: 'prose',
      text: 'Both sides send constantly, so this is one of the genuine WebSocket cases rather than an SSE one. That decision brings its costs with it: L4 load balancing, connection state, and reconnection logic you write yourself.',
    },
    {
      kind: 'flow',
      nodes: ['Client', 'L4 LB', 'Chat server (holds sockets)', 'Message store', 'Pub/sub', 'Recipient chat server'],
    },
    { kind: 'heading', text: 'Deep dive 1 — reaching the right server' },
    {
      kind: 'prose',
      text: 'The sender is connected to server A; the recipient to server K. A never knows which. Two answers, and the choice is real:',
    },
    {
      kind: 'compare',
      left: {
        title: 'Pub/sub on the conversation',
        points: [
          'Every server subscribes to topics for its connected users',
          'Servers stay interchangeable — any client can land anywhere',
          'The broker carries all message traffic',
        ],
      },
      right: {
        title: 'Connection registry',
        points: [
          'Redis maps userId → server holding the socket',
          'Direct server-to-server delivery, one hop',
          'The registry must be kept accurate through crashes and rebalances',
        ],
      },
      verdict: 'A registry scales better at this volume and keeps the broker off the hot path — but it is the piece most likely to go stale, so it needs a TTL refreshed by heartbeat.',
    },
    { kind: 'heading', text: 'Deep dive 2 — never losing a message' },
    {
      kind: 'prose',
      text: 'The recipient is offline more often than not. So delivery is not "push down the socket" — it is **write durably first, then attempt push**.',
    },
    {
      kind: 'list',
      ordered: true,
      items: [
        'Client sends with a **client-generated message id** (a UUID). This makes the whole path idempotent — a retry after a flaky send does not duplicate the message.',
        'Server persists to the recipient\'s inbox and assigns a **per-conversation sequence number**. Never order by wall-clock time: device clocks disagree, and two participants would see different orders.',
        'Server acknowledges to the sender — one tick.',
        'If the recipient is connected, push. On their ack, mark delivered — two ticks.',
        'When they open the conversation, a read receipt goes back — blue ticks.',
      ],
    },
    {
      kind: 'callout',
      tone: 'say',
      text: 'Reconnection is the part candidates skip. A phone loses signal constantly, so the client stores the last sequence number it saw and asks "everything after N" on reconnect. Without that cursor, a user in a tunnel silently loses messages and no amount of socket sophistication saves you.',
    },
    { kind: 'heading', text: 'Deep dive 3 — groups' },
    {
      kind: 'prose',
      text: 'A group message is fan-out on write: one send becomes N inbox writes. At a few hundred members that is fine synchronously. Past that, it goes through a queue and workers — the same shape as a news feed, with the same reasoning about who pays the cost.',
    },
    {
      kind: 'prose',
      text: 'Receipts are the hidden scaling problem: a 500-member group produces 500 delivered receipts and 500 read receipts **per message**. That is a 1000× write amplification on metadata nobody reads carefully. Aggregate them — store counts and a member list, push a summary rather than an event per member.',
    },
    {
      kind: 'callout',
      tone: 'note',
      text: 'Worth one sentence: with end-to-end encryption the server stores ciphertext it cannot read. That rules out server-side search, server-side spam filtering, and previews — the client does all of it. Mentioning the consequence, not just the acronym, is what reads as depth.',
    },
  ],
}
