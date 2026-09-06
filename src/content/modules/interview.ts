import type { Module } from '../types'

/**
 * Track 4 — Running the room.
 *
 * Everything up to here is knowledge. This track is performance: doing it under a clock,
 * out loud, with someone judging, on a problem you have never seen.
 */

export const interviewModules: Module[] = [
  /* ---------------------------------------------------------------- */
  {
    id: 'i-room',
    trackId: 'interview',
    title: 'Running the room',
    station: 1,
    prereqs: ['a-proximity'],
    minutes: 9,
    summary: 'What separates E4 from E5 from E6, how people actually lose, and what to do when you do not know.',
    lesson: [
      {
        kind: 'prose',
        text: 'Two engineers with identical knowledge routinely get different results. The difference is almost never a missing technology — it is who drove the session.',
      },
      { kind: 'heading', text: 'The levels' },
      {
        kind: 'table',
        head: ['', 'Mid · E4', 'Senior · E5', 'Staff+ · E6'],
        rows: [
          ['**Split**', 'breadth only', '~60% breadth, 40% depth', '~40% breadth, 60% depth'],
          [
            '**Who drives**',
            'The interviewer points at what to improve',
            '**You do.** You name bottlenecks before they are raised',
            'You set the scope and the trade-offs; they mostly listen',
          ],
          [
            '**Depth**',
            '"We would use Elasticsearch."',
            '"Inverted index, fed by CDC, so it lags a second — fine for search, not for booking."',
            'Drawn from having run it: what broke, what it cost, what you would change',
          ],
          [
            '**Trade-offs**',
            'Picks something reasonable',
            'States the alternative and why it lost',
            'Reframes the question so a better trade becomes available',
          ],
        ],
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'If the interviewer is telling you where to look, that is mid-level signal being written down — regardless of how good your answers are once they point. Reaching minute 30 with your own list of bottlenecks is the single highest-leverage habit in this entire app.',
      },
      { kind: 'heading', text: 'How strong candidates actually lose' },
      {
        kind: 'list',
        items: [
          '**Never narrowing scope.** Nine requirements, forty minutes, nothing finished.',
          '**Complexity too early.** Kafka and sharding before there is a working system to scale.',
          '**Filling the deep-dive slot.** The interviewer\'s questions are how you score; talking through them denies you the points.',
          '**Technologies without reasons.** A bill of materials is not a design.',
          '**Stale numbers.** Sharding at 10k writes/sec because that was a lot in 2010.',
          '**Spaghetti.** Boxes that each make sense and together do not compose.',
        ],
      },
      { kind: 'heading', text: 'When you do not know something' },
      {
        kind: 'prose',
        text: 'You will be asked something you have not met. This is expected, and it is a test of a different thing.',
      },
      {
        kind: 'compare',
        left: {
          title: 'What loses',
          points: [
            'Bluffing with confident vagueness',
            '"I have not used that" and stopping',
            'Changing the subject to something you do know',
          ],
        },
        right: {
          title: 'What works',
          points: [
            'Say the boundary plainly, then reason from what you do know',
            '"I have not operated Flink, but this is a windowed aggregation — here is how I would shape it, and here is what I would want to verify."',
            'Ask one specific question, then continue',
          ],
        },
        verdict: 'Reasoning visibly from first principles scores better than a memorised answer. Bluffing scores worst of all, because interviewers can tell and it costs you trust for the rest of the session.',
      },
      { kind: 'heading', text: 'Three habits worth more than another topic' },
      {
        kind: 'list',
        ordered: true,
        items: [
          '**Close the loop.** Last two minutes: walk back through your non-functional requirements and point at what satisfies each.',
          '**Say the alternative you rejected.** One clause — "I considered fan-out on read, but the follow counts here kill it" — is the cheapest depth signal available.',
          '**Leave silence after a deep dive.** Two or three seconds. They will ask the question that lets you show the thing you know.',
        ],
      },
    ],
    quiz: [
      {
        id: 'q-i-room-1',
        moduleId: 'i-room',
        stem: 'The clearest behavioural difference between E4 and E5 in a design interview is:',
        options: [
          'Knowing more technologies',
          'Who identifies the bottlenecks — you, or the interviewer',
          'Drawing a more detailed architecture',
          'Finishing faster',
        ],
        correct: 1,
        explain:
          'At E5 you name bottlenecks and choose which to open. If the interviewer is pointing, that is mid-level signal being recorded no matter how good the answer is afterwards.',
      },
      {
        id: 'q-i-room-2',
        moduleId: 'i-room',
        stem: 'You are asked about a technology you have never used. Best response?',
        options: [
          'Give a confident general answer and hope it lands',
          'Say you have not used it and wait for a different question',
          'Name the boundary, then reason from the underlying problem and say what you would verify',
          'Redirect to a technology you know well',
        ],
        correct: 2,
        explain:
          'Visible first-principles reasoning scores better than recall. Bluffing scores worst — interviewers can tell, and it costs you trust for everything you say afterwards.',
      },
      {
        id: 'q-i-room-3',
        moduleId: 'i-room',
        stem: 'You finish a deep dive with time remaining. What is the highest-value next move?',
        options: [
          'Start another deep dive immediately',
          'Pause for a few seconds and let the interviewer ask',
          'Summarise everything you have said so far',
          'Add more detail to the diagram',
        ],
        correct: 1,
        explain:
          'Their questions are how you score, and they have signals to collect. A short silence invites the question that lets you demonstrate the thing they are looking for.',
      },
    ],
    cards: [
      {
        id: 'c-i-room-1',
        moduleId: 'i-room',
        front: 'What separates E5 from E4 in the deep dives?',
        back: 'Who drives. At E5 you name the bottlenecks and pick which to open; if the interviewer is pointing, that is mid-level signal being recorded.',
        tag: 'Level',
      },
      {
        id: 'c-i-room-2',
        moduleId: 'i-room',
        front: 'What do you do when asked about something you have never used?',
        back: 'Name the boundary plainly, then reason from the underlying problem and say what you would want to verify. Bluffing is the worst option — it costs trust for the rest of the session.',
        tag: 'Level',
      },
      {
        id: 'c-i-room-3',
        moduleId: 'i-room',
        front: 'The most common senior failure mode.',
        back: 'Talking through the entire deep-dive slot. The interviewer\'s questions are how you score — leave silence.',
        tag: 'Level',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'i-recognition',
    trackId: 'interview',
    title: 'Reading a question you have never seen',
    station: 2,
    prereqs: ['i-room'],
    minutes: 8,
    summary: 'Decompose an unfamiliar prompt into two or three known patterns, in about ninety seconds.',
    lesson: [
      {
        kind: 'prose',
        text: 'You will be asked to design something you have not prepared. That is fine, and it is the situation this whole track exists for: almost every question is two or three known patterns wearing a product\'s clothes.',
      },
      { kind: 'heading', text: 'The ninety-second decomposition' },
      {
        kind: 'list',
        ordered: true,
        items: [
          '**What is written, and what is read?** Almost every system is one of these dominating the other. The ratio picks your first lever.',
          '**Does anything need to be exclusive?** Booking, bidding, limited stock — that is contention, and it is usually the deep dive that matters most.',
          '**Does anything take longer than a request?** Encoding, generation, external calls — that is the async pattern.',
          '**Does anything need to arrive without being asked for?** That is real-time.',
          '**Is there anything big?** Files, video — that is blobs, and the bytes never touch your servers.',
          '**Is there anything geographic, or any free text?** Those each buy a specialised index.',
        ],
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'You can say this out loud, and it lands well: "Reading this, I see a read-heavy feed problem with a contention problem inside it — those are the two I want to spend the deep dives on." You have just set the agenda in one sentence.',
      },
      { kind: 'heading', text: 'Worked decompositions' },
      {
        kind: 'table',
        head: ['Prompt', 'Patterns', 'The deep dive that matters'],
        rows: [
          ['**Ticketmaster**', 'Contention · scaling reads · search', 'Reservations that expire without a held lock'],
          ['**News feed**', 'Scaling reads · scaling writes', 'Fan-out on read vs write, and the celebrity case'],
          ['**Uber**', 'Proximity · contention · real-time', 'Matching without assigning one driver twice'],
          ['**YouTube**', 'Large blobs · long-running tasks · scaling reads', 'Upload and transcode pipeline'],
          ['**Ad click aggregator**', 'Scaling writes · streams', 'Idempotency and windowed aggregation'],
          ['**Google Docs**', 'Real-time · contention', 'Conflict resolution — OT or CRDT'],
          ['**Dropbox**', 'Large blobs · multi-step', 'Chunking, dedupe, and sync conflicts'],
          ['**Rate limiter**', 'Contention · scaling reads', 'Distributed counter accuracy versus latency'],
        ],
      },
      {
        kind: 'prose',
        text: 'Notice how few distinct patterns cover the whole catalogue. That is the leverage: you are not learning thirty systems, you are learning eight shapes and how they combine.',
      },
      { kind: 'heading', text: 'When the prompt is genuinely unfamiliar' },
      {
        kind: 'prose',
        text: 'Ask what it is for. Not "what are the requirements" — ask who uses it and what they are trying to do. The answer almost always names the patterns for you, and asking it is exactly what you would do on the job.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Pattern-matching to a memorised architecture instead of to the shape. If you decide it is "basically Twitter" and reproduce a Twitter design, you will miss the constraint that makes this problem different — and the interviewer chose that constraint deliberately.',
      },
    ],
    quiz: [
      {
        id: 'q-i-recognition-1',
        moduleId: 'i-recognition',
        stem: '"Design a flash sale system — 10,000 units, 2 million people, one minute." Which patterns dominate?',
        options: [
          'Large blobs and multi-step processes',
          'Contention and scaling reads',
          'Proximity and real-time',
          'Search and scaling writes',
        ],
        correct: 1,
        explain:
          'Limited stock with simultaneous buyers is contention. Two million people loading the page is a read-scaling problem. Recognising both in one sentence sets your deep-dive agenda immediately.',
      },
      {
        id: 'q-i-recognition-2',
        moduleId: 'i-recognition',
        stem: 'What is the risk of deciding a new prompt is "basically Twitter"?',
        options: [
          'None — reusing a known design is efficient',
          'You reproduce a memorised architecture and miss the constraint that makes this problem different',
          'The interviewer will think you have not prepared',
          'Twitter designs are always too complex',
        ],
        correct: 1,
        explain:
          'Match to the shape, not the product. The interviewer chose a specific constraint deliberately, and a recalled architecture will not have it.',
      },
    ],
    cards: [
      {
        id: 'c-i-recognition-1',
        moduleId: 'i-recognition',
        front: 'The six questions that decompose an unfamiliar prompt.',
        back: 'Read or write heavy? Anything exclusive (contention)? Anything slower than a request (async)? Anything pushed (real-time)? Anything big (blobs)? Anything geographic or free-text (specialised index)?',
        tag: 'Interview',
      },
      {
        id: 'c-i-recognition-2',
        moduleId: 'i-recognition',
        front: 'Why match to the shape rather than the product?',
        back: 'Deciding it is "basically Twitter" reproduces a memorised architecture and misses the constraint the interviewer deliberately chose to make this problem different.',
        tag: 'Interview',
      },
    ],
  },
]
