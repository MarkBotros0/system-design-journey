import type { GlossaryEntry } from '../glossary'

/** Glossary entries added by the problemsC content author. Same shape and rules as glossary.ts. */
export const terms: GlossaryEntry[] = [
  {
    id: 'PSP',
    full: 'Payment Service Provider',
    gist: 'The company that takes a card payment from a merchant and gets it approved by the customer\'s bank — Stripe, Adyen, Braintree. To a payments design it is the slow, external party that can time out without saying whether it took the money.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'Merchant', sub: 'your checkout', to: 'charge' },
        { label: 'PSP', sub: 'Stripe, Adyen', tone: 'line', to: 'authorise' },
        { label: 'Card network', sub: 'Visa, Mastercard', to: 'route' },
        { label: 'Issuing bank', sub: 'approves or declines' },
      ],
      note: 'Each hop adds latency and a way to fail, which is why an authorisation takes on the order of a second.',
    },
    caption: 'A charge travels through the PSP and the card network to the customer\'s bank, and the answer comes back the same way.',
    seeAlso: ['PCI', 'API'],
  },
  {
    id: 'PCI',
    full: 'Payment Card Industry Data Security Standard (PCI DSS)',
    gist: 'The security rules for any system that stores, processes or transmits card numbers. Every service that touches a raw card number is in scope and audited, so good designs tokenise the card at the edge and keep that scope to one small vault.',
    figure: {
      kind: 'split',
      left: {
        title: 'Card numbers everywhere',
        tone: 'alert',
        nodes: [
          { label: 'Checkout', to: 'card number' },
          { label: 'Orders', to: 'card number' },
          { label: 'Payments', sub: 'all in scope' },
        ],
        cost: 'Every service, log and backup that sees the number is audited.',
      },
      right: {
        title: 'Tokenised at the edge',
        tone: 'mastered',
        nodes: [
          { label: 'Card form', to: 'card number' },
          { label: 'Vault', sub: 'the only thing in scope', tone: 'line', to: 'token' },
          { label: 'Everything else', sub: 'handles tokens' },
        ],
        cost: 'One small service carries the audit.',
      },
      verdict: 'Keep raw card numbers in as few places as possible — ideally one.',
    },
    caption: 'Tokenising at the edge shrinks the audited part of the system from everything to one vault.',
    seeAlso: ['PSP'],
  },
  {
    id: 'HMAC',
    full: 'Hash-based Message Authentication Code',
    gist: 'A tag, usually called a signature, made by hashing a message together with a secret key. Whoever holds the key can check the message came from someone else holding it and was not altered — which is how webhooks and signed tokens are verified without a database lookup.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'Payload + secret', sub: 'sender', to: 'keyed hash' },
        { label: 'Signature', sub: 'sent in a header', tone: 'line', to: 'deliver' },
        { label: 'Receiver recomputes', sub: 'same payload, same secret', to: 'compare' },
        { label: 'Match: trusted', sub: 'mismatch: rejected', tone: 'mastered' },
      ],
      note: 'Add a timestamp to what you sign and reject old ones, or a captured message can be replayed later.',
    },
    caption: 'Both sides hash the payload with the shared secret; only a matching signature is accepted.',
    seeAlso: ['JWT', 'API'],
  },
  {
    id: 'CAPTCHA',
    full: 'Completely Automated Public Turing test to tell Computers and Humans Apart',
    gist: 'A challenge that is cheap for a person and expensive for a script, from an invisible browser check to a picture puzzle. It raises the cost of automation rather than stopping it — paid solving services exist — so it is one layer of bot defence, never the only one.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'Request', sub: 'person or script?', to: 'looks risky' },
        { label: 'Challenge', sub: 'invisible first, puzzle if needed', tone: 'line', to: 'passed' },
        { label: 'Let through', sub: 'with a short-lived pass', tone: 'mastered' },
      ],
      note: 'Challenge only what looks risky, and remember a pass, so real people are not puzzled on every click.',
    },
    caption: 'Only risky-looking requests are challenged, and passing earns a short-lived pass.',
    seeAlso: ['IP'],
  },
]
