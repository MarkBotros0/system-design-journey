import type { GlossaryEntry } from '../glossary'

/** Glossary entries added by the production content author. Same shape and rules as glossary.ts. */
export const terms: GlossaryEntry[] = [
  /* ---------------- observability and reliability ---------------- */
  {
    id: 'RED',
    full: 'Rate, Errors, Duration',
    gist: 'Three metrics to put on every service that serves requests: requests per second, failed requests per second, and the latency distribution. Tom Wilkie named the method, and it describes what users experience.',
    figure: {
      kind: 'stack',
      layers: [
        { label: 'Rate', sub: 'requests per second', tone: 'line' },
        { label: 'Errors', sub: 'failed requests per second', tone: 'alert' },
        { label: 'Duration', sub: 'p50, p95, p99 latency', tone: 'line' },
      ],
      note: 'Latency is a distribution. A mean of 80 ms can hide a p99 of three seconds.',
    },
    caption: 'Three numbers per service that say whether users are being served well.',
    seeAlso: ['USE', 'SLI'],
  },
  {
    id: 'USE',
    full: 'Utilisation, Saturation, Errors',
    gist: "Brendan Gregg's checklist for every resource (CPU, memory, disk, network, connection pools): how busy it is, how much work is queued for it, and whether it is failing. It finds which resource ran out.",
    figure: {
      kind: 'stack',
      layers: [
        { label: 'Utilisation', sub: 'busy 70% of the time', tone: 'line' },
        { label: 'Saturation', sub: '12 requests waiting', tone: 'streak' },
        { label: 'Errors', sub: 'failed allocations, dropped packets', tone: 'alert' },
      ],
      note: 'Saturation is the one people forget. A pool at 100% utilisation with nothing queued is fine; one with forty waiters is your outage.',
    },
    caption: 'Three questions to ask of every resource when a service is slow.',
    seeAlso: ['RED', 'CPU'],
  },
  {
    id: 'SLI',
    full: 'Service Level Indicator',
    gist: 'A measurement of how a service behaves for its users, written as good events over valid events: the share of requests that succeeded in under 300 ms, say. It is the number an SLO sets a target for.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'Good requests', sub: 'no error, under 300 ms', to: 'divided by' },
        { label: 'Valid requests', sub: 'excluding bots and bad input', to: 'equals' },
        { label: 'SLI', sub: '99.94% this month', tone: 'line' },
      ],
    },
    caption: 'An SLI is a ratio of good events to the events that should have been good.',
    seeAlso: ['SLO', 'SLA'],
  },
  {
    id: 'SLO',
    full: 'Service Level Objective',
    gist: 'Your internal target for an SLI over a window, such as 99.9% over 30 days. The gap between it and 100% is the error budget, which tells you when to keep shipping and when to stop and fix things.',
    figure: {
      kind: 'ratio',
      parts: [
        { label: 'Budget spent: 26 minutes', value: 26, tone: 'streak' },
        { label: 'Budget left: 17 minutes', value: 17.2, tone: 'mastered' },
      ],
      note: 'A 99.9% SLO over 30 days allows 43 minutes of failure. While some is left, the team keeps shipping.',
    },
    caption: 'The SLO defines an error budget, and tracking how fast it is spent is how the target gets used.',
    seeAlso: ['SLI', 'SLA', 'MTTR'],
  },
  {
    id: 'MTTR',
    full: 'Mean Time To Recovery',
    gist: 'The average time from an incident starting to the service being restored. Halving it halves the downtime of every incident, and a fast rollback is usually the cheapest way to do that.',
    figure: {
      kind: 'timeline',
      ticks: ['0', '10 min', '20 min', '30 min', '40 min'],
      lanes: [
        { label: 'Detect', bars: [{ from: 0, to: 0.2, label: 'alert fires', tone: 'streak' }] },
        { label: 'Diagnose', bars: [{ from: 0.2, to: 0.55, label: 'find the bad deploy', tone: 'alert' }] },
        {
          label: 'Recover',
          bars: [{ from: 0.55, to: 0.7, label: 'roll back', tone: 'mastered' }],
          outcome: { label: 'restored', tone: 'mastered' },
        },
      ],
    },
    caption: 'Recovery time is detection, plus diagnosis, plus the fix. Each phase can be shortened on its own.',
    seeAlso: ['SLO'],
  },

  /* ---------------- identity and access ---------------- */
  {
    id: 'OIDC',
    full: 'OpenID Connect',
    gist: 'An identity layer on top of OAuth 2.0. OAuth lets an app act for a user; OIDC also tells the app who that user is, with a signed ID token. "Sign in with Google" runs on it.',
    figure: {
      kind: 'stack',
      layers: [
        { label: 'OIDC', sub: 'who signed in: the ID token', tone: 'line' },
        { label: 'OAuth 2.0', sub: 'what the app may do: the access token', tone: 'neutral' },
        { label: 'TLS', sub: 'a private, authenticated channel', tone: 'neutral' },
      ],
    },
    caption: "OIDC adds identity on top of OAuth's delegated access.",
    seeAlso: ['JWT', 'PKCE'],
  },
  {
    id: 'PKCE',
    full: 'Proof Key for Code Exchange',
    gist: 'An addition to the OAuth authorization code flow. The app commits to a random secret at the start and reveals it at the end, so an intercepted code is useless to anyone else. Required for mobile and browser apps, recommended for all.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'Start the flow', sub: 'send hash(verifier)', to: 'code via browser' },
        { label: 'Exchange the code', sub: 'send the verifier itself', tone: 'line', to: 'server compares' },
        { label: 'Tokens', sub: 'only if the hash matches', tone: 'mastered' },
      ],
    },
    caption: 'The challenge goes out first. Only the app that made it can produce the verifier later.',
    seeAlso: ['OIDC'],
  },
  {
    id: 'RBAC',
    full: 'Role-Based Access Control',
    gist: 'Permissions are granted to roles, and users are given roles. Easy to reason about and to audit, which makes it the right default, until special cases multiply into hundreds of roles.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'Ana', sub: 'a user', to: 'has role' },
        { label: 'Editor', sub: 'a role', tone: 'line', to: 'grants' },
        { label: 'edit, publish', sub: 'permissions', tone: 'mastered' },
      ],
    },
    caption: 'Users never hold permissions directly. Roles sit in between.',
    seeAlso: ['ABAC'],
  },
  {
    id: 'ABAC',
    full: 'Attribute-Based Access Control',
    gist: 'Access decided by a policy over attributes of the user, the resource, the action and the context. It expresses rules that roles cannot, like spending limits or regions, at the cost of policies that must be tested like code.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'Attributes', sub: 'manager, sales, $3,000', to: 'evaluated by' },
        { label: 'Policy', sub: 'managers: own department, under $5,000', tone: 'line', to: 'decides' },
        { label: 'Allow', tone: 'mastered' },
      ],
    },
    caption: 'A policy reads facts about the request and returns allow or deny.',
    seeAlso: ['RBAC'],
  },
  {
    id: 'SPIFFE',
    full: 'Secure Production Identity Framework For Everyone',
    gist: 'An open standard for workload identity. Each service gets a name like spiffe://example.org/payments and short-lived certificates proving it, issued by the platform rather than copied around as secrets. Istio issues identities in this format.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'Platform', sub: 'verifies the workload', to: 'issues' },
        { label: 'Certificate', sub: 'spiffe://example.org/payments', tone: 'line', to: 'over mTLS' },
        { label: 'Callee', sub: 'authorises by name', tone: 'mastered' },
      ],
    },
    caption: 'Identity comes from the platform, not from a secret someone pasted into config.',
    seeAlso: ['mTLS'],
  },
  {
    id: 'IAM',
    full: 'Identity and Access Management',
    gist: "A cloud provider's system of identities, roles and policies that decides who may call which API on which resource. Every role's policy is a blast radius, which is why least privilege is mostly done here.",
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'Role', sub: 'upload-service', tone: 'line', to: 'may call' },
        { label: 's3:PutObject', sub: 'one action', to: 'on' },
        { label: 'uploads/*', sub: 'one prefix, not every bucket', tone: 'mastered' },
      ],
    },
    caption: 'A policy names the identity, the action and the resource. Narrow all three.',
    seeAlso: ['AWS', 'S3'],
  },

  /* ---------------- transport and web security ---------------- */
  {
    id: 'TLS',
    full: 'Transport Layer Security',
    gist: 'The protocol that encrypts a connection and proves the server is who its certificate says. It is the S in HTTPS, and it belongs on internal hops too, not only at the public edge.',
    figure: {
      kind: 'stack',
      layers: [
        { label: 'HTTP', sub: 'the request', tone: 'neutral' },
        { label: 'TLS', sub: 'encrypted, tamper-evident, server verified', tone: 'line' },
        { label: 'TCP', sub: 'reliable delivery', tone: 'neutral' },
      ],
    },
    caption: 'TLS sits between the application protocol and the transport, so HTTP itself does not change.',
    seeAlso: ['mTLS', 'HTTP', 'TCP'],
  },
  {
    id: 'mTLS',
    full: 'Mutual TLS',
    gist: 'TLS where both sides present a certificate, so the server also knows which client is calling. Inside a service mesh it gives every service a verifiable identity and encrypts every internal hop.',
    figure: {
      kind: 'split',
      left: {
        title: 'TLS',
        nodes: [
          { label: 'Client', to: 'checks' },
          { label: 'Server certificate', tone: 'line' },
        ],
        cost: 'The client knows the server. The server knows nothing about the client.',
      },
      right: {
        title: 'Mutual TLS',
        tone: 'mastered',
        nodes: [
          { label: 'Client certificate', tone: 'line', to: 'both check' },
          { label: 'Server certificate', tone: 'line' },
        ],
        cost: 'Each side proves who it is on every connection.',
      },
    },
    caption: 'Ordinary TLS authenticates one end. Mutual TLS authenticates both.',
    seeAlso: ['TLS', 'SPIFFE'],
  },
  {
    id: 'XSS',
    full: 'Cross-Site Scripting',
    gist: "An attacker gets their script to run on your page, often by saving input that you later render as markup. The script then acts as whoever is viewing. Escape output for its context; React does it by default.",
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'Attacker comment', sub: 'a script tag in a text field', tone: 'alert', to: 'stored, rendered' },
        { label: 'Your page', sub: 'runs it as code', tone: 'alert', to: 'as the viewer' },
        { label: 'Session hijacked', tone: 'alert' },
      ],
    },
    caption: "Input rendered as markup becomes code running with the viewer's privileges.",
    seeAlso: ['CSRF', 'OWASP'],
  },
  {
    id: 'CSRF',
    full: 'Cross-Site Request Forgery',
    gist: "Another site makes the user's browser send a request to yours, and the browser attaches their cookies, so the request looks legitimate. SameSite cookies and anti-forgery tokens stop it.",
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'Attacker page', sub: 'a hidden form', tone: 'alert', to: 'auto-submits' },
        { label: "Victim's browser", sub: 'attaches the bank cookie', to: 'POST /transfer' },
        { label: 'Your bank', sub: 'sees a signed-in user', tone: 'alert' },
      ],
    },
    caption: 'The attacker never sees the cookie. They borrow the browser that holds it.',
    seeAlso: ['XSS', 'OWASP'],
  },
  {
    id: 'SSRF',
    full: 'Server-Side Request Forgery',
    gist: 'Your server fetches an address an attacker chose and reaches places only it can see: internal admin panels, or the cloud metadata endpoint that hands out credentials. Any feature that fetches a user-supplied URL is a candidate.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'Attacker', sub: 'url=http://169.254.169.254/', tone: 'alert', to: 'asks you to fetch' },
        { label: 'Your server', sub: 'inside the network', to: 'fetches' },
        { label: 'Metadata service', sub: 'returns credentials', tone: 'alert' },
      ],
    },
    caption: 'The attacker cannot reach the internal address. Your server can, and does it for them.',
    seeAlso: ['OWASP', 'IAM'],
  },
  {
    id: 'OWASP',
    full: 'Open Worldwide Application Security Project',
    gist: 'A non-profit best known for the OWASP Top 10, a ranked list of the most critical web application risks. Broken access control was number one in the 2021 edition and kept the spot in 2025.',
    figure: {
      kind: 'stack',
      layers: [
        { label: '1. Broken access control', tone: 'alert' },
        { label: '2. Cryptographic failures', tone: 'streak' },
        { label: '3. Injection', sub: 'now includes XSS', tone: 'streak' },
        { label: '10. Server-side request forgery', sub: 'new in 2021', tone: 'neutral' },
      ],
      note: 'Much of the list is the same two mistakes: trusting input, and forgetting to check permissions.',
    },
    caption: 'The top of the 2021 OWASP Top 10, and one of its new entries at number ten.',
    seeAlso: ['XSS', 'CSRF', 'SSRF'],
  },
  {
    id: 'KMS',
    full: 'Key Management Service',
    gist: 'A managed service that holds master keys and never exports them. You send it small data keys to wrap and unwrap, and every use is permission-checked and logged. AWS KMS and Google Cloud KMS are the usual examples.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'App', sub: 'holds an encrypted data key', to: 'unwrap this' },
        { label: 'KMS', sub: 'checks permission, logs it', tone: 'line', to: 'plaintext data key' },
        { label: 'App', sub: 'decrypts the file locally', tone: 'mastered' },
      ],
    },
    caption: 'The master key stays inside the KMS. Only the small data key travels.',
    seeAlso: ['IAM'],
  },
  {
    id: 'STRIDE',
    full: 'Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege',
    gist: 'A checklist of six threat types from Microsoft, for asking "what can go wrong?" at each trust boundary in a design. Each threat is the violation of one property you were relying on.',
    figure: {
      kind: 'stack',
      layers: [
        { label: 'Spoofing', sub: 'breaks authentication', tone: 'alert' },
        { label: 'Tampering', sub: 'breaks integrity', tone: 'alert' },
        { label: 'Repudiation', sub: 'breaks the audit trail', tone: 'streak' },
        { label: 'Information disclosure', sub: 'breaks confidentiality', tone: 'alert' },
        { label: 'Denial of service', sub: 'breaks availability', tone: 'streak' },
        { label: 'Elevation of privilege', sub: 'breaks authorisation', tone: 'alert' },
      ],
    },
    caption: 'Six threats, each paired with the property it violates.',
    seeAlso: ['OWASP'],
  },
]
