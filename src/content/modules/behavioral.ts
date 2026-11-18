import type { Module } from '../types'

/**
 * The interview track (I), stations 3–5: behavioral answers for senior roles.
 * trackId: 'interview'. Authoring rules: docs/superpowers/plans/2026-11-18-content-brief.md
 *
 * Behavioural lessons replace code with example answers. Every story in an `example`
 * callout is hypothetical and says so: a made-up story attributed to a real company would
 * be an invented case, which the voice rules forbid. Real practices (disagree and commit,
 * one-way doors, blameless postmortems) are named where they come from.
 */
export const behavioralModules: Module[] = [
  /* ---------------------------------------------------------------- */
  {
    id: 'i-star',
    trackId: 'interview',
    title: 'Stories that show scope',
    station: 3,
    prereqs: ['i-recognition'],
    related: ['i-room'],
    minutes: 14,
    summary:
      'STAR as a skeleton, the four signals of senior scope, and a bank of six to eight stories that covers most questions.',
    objectives: [
      'Structure any answer as [[STAR]] and land it in two to three minutes',
      'Put the four signals of senior scope into a story: ambiguity, reach beyond your team, multiplying others, a measured result',
      'Build a bank of six to eight stories that covers the common question themes',
    ],
    keywords: [
      'STAR method',
      'behavioural interview',
      'behavioral',
      'tell me about a time',
      'story bank',
      'project you led',
      'leadership principles',
      'senior scope',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'The behavioural round is not a personality test. It is evidence-gathering: the interviewer has a list of signals for the level, and each story either produces evidence for one of them or wastes the slot. At senior level the question behind every question is "how big a problem can we hand this person, and how much of it gets done without anyone managing them?"',
      },
      {
        kind: 'prose',
        text: 'Most candidates who fail here have good material. They lose because the story is shapeless — three minutes of background, an action told as "we", no result — or because a true story is sized for the level below. Both are fixable before the day, and neither is fixable during it.',
      },
      {
        kind: 'figure',
        caption: 'Four beats. The action is where the signal is; everything before it is set-up.',
        figure: {
          kind: 'flow',
          nodes: [
            { label: 'Situation', sub: 'the stakes, in two sentences' },
            { label: 'Task', sub: 'what was yours, and why it was hard' },
            { label: 'Action', sub: 'your decisions, said as "I"', tone: 'line' },
            { label: 'Result', sub: 'a number, then what changed' },
          ],
          note: 'Close with one line of reflection: what you would keep, or do differently. It turns a report into judgement.',
        },
      },
      { kind: 'heading', text: 'The skeleton' },
      {
        kind: 'prose',
        text: '[[STAR]] — Situation, Task, Action, Result — is not a script. It is a guard against the two ways a story collapses: drowning in context, and never saying what you personally did. Use it as the skeleton and let the content carry the weight.',
      },
      {
        kind: 'list',
        items: [
          '**Situation — two sentences.** The company, the system, what was at stake. If the interviewer needs your architecture to follow the story, you have the wrong story or the wrong level of detail.',
          '**Task — what was yours, and why it was hard.** "I was asked to…" is fine. "I noticed… and nobody owned it" is better. The difficulty is what makes the action impressive.',
          '**Action — most of the answer.** The decisions you made, the options you rejected, the people you brought along. "We" is fine for the team\'s work; your part gets its own sentences, in "I".',
          '**Result — a number, then a consequence.** "p99 fell from 900 ms to 180 ms, and the mobile team deleted their own cache." Then one line on what you learned.',
        ],
      },
      {
        kind: 'figure',
        caption:
          'The same story told twice. The structured version spends its time on what you did, and stops with room to spare.',
        figure: {
          kind: 'timeline',
          ticks: ['0:00', '0:45', '1:30', '2:15', '3:00'],
          lanes: [
            {
              label: 'Shapeless',
              bars: [
                { from: 0, to: 0.55, label: 'background', tone: 'alert' },
                { from: 0.55, to: 1, label: '"we" did things', tone: 'streak' },
              ],
              outcome: { label: 'out of time', tone: 'alert' },
            },
            {
              label: 'Structured',
              bars: [
                { from: 0, to: 0.17, label: 'S·T', tone: 'neutral' },
                { from: 0.17, to: 0.67, label: 'action', tone: 'line' },
                { from: 0.67, to: 0.83, label: 'result', tone: 'mastered' },
              ],
              outcome: { label: 'room for follow-ups', tone: 'mastered' },
            },
          ],
          note: 'Two and a half minutes, then stop. Whatever the interviewer needs, they will ask for — and the follow-ups are where the level gets decided.',
        },
      },
      { kind: 'heading', text: 'What senior scope sounds like' },
      {
        kind: 'prose',
        text: 'The same project can be told at three levels. What changes is not the technology. It is how much was undefined when the work reached you, how far beyond your team it went, and whether other people got better because you were there. Interviewers listen for four signals.',
      },
      {
        kind: 'table',
        head: ['Signal', 'Sounds like', 'Does not sound like'],
        rows: [
          [
            '**Ambiguity handled**',
            '"Nobody had defined reliable, so I wrote up three targets and got both directors to pick one."',
            '"I was given a ticket to add retries."',
          ],
          [
            '**Reach beyond your team**',
            '"It touched payments, mobile and support, so I ran a thirty-minute weekly sync and kept a decision log."',
            '"I coordinated with other teams."',
          ],
          [
            '**Multiplier**',
            '"I wrote the migration guide and paired with the first two teams. The other nine moved without me."',
            '"I did most of it myself to make sure it was right."',
          ],
          [
            '**Measured result**',
            '"Checkout errors fell from 1.2% to 0.3% over six weeks."',
            '"It went really well and people were happy."',
          ],
        ],
      },
      {
        kind: 'figure',
        caption: 'How much was undefined when the work reached you. Senior stories start at the third row.',
        figure: {
          kind: 'stack',
          layers: [
            { label: 'Here is the ticket', sub: 'junior · do it', tone: 'neutral' },
            { label: 'Here is the goal', sub: 'mid · choose the approach', tone: 'neutral' },
            { label: 'Here is the problem', sub: 'senior · define the goal', tone: 'line' },
            { label: 'Here is an area', sub: 'staff · find the problems', tone: 'mastered' },
          ],
          note: 'Pick stories from the row you are interviewing for. A flawless ticket story is still a ticket story.',
        },
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'Open with the stakes and your role in one breath: "One payment in a hundred was failing, the fix crossed three teams so nobody owned it, and I took it on." The interviewer knows the scope before you have said a technical word.',
      },
      { kind: 'heading', text: 'The story bank' },
      {
        kind: 'prose',
        text: 'You cannot improvise a good story under pressure, and you do not need forty. Six to eight stories, each rehearsed until it lands in two and a half minutes, cover most of what you will be asked, because each one can be told from more than one angle. Amazon is the extreme case: each interviewer in the loop is given a few of its leadership principles to probe, so you need different stories for different rooms.',
      },
      {
        kind: 'table',
        head: ['Theme', 'Questions it answers', 'The story you need'],
        rows: [
          [
            '**Leading a project**',
            '"A project you led" · "Your proudest work"',
            'Something you drove end to end, toward a goal you helped define',
          ],
          [
            '**Ambiguity**',
            '"A problem with no clear answer" · "Requirements that kept changing"',
            'A vague worry you turned into a plan other people followed',
          ],
          [
            '**Conflict**',
            '"You disagreed with a peer" · "You pushed back on your manager"',
            'A real disagreement, settled on the merits, relationship intact',
          ],
          [
            '**Influence**',
            '"You convinced people you had no authority over" · "You drove adoption"',
            'A change other teams took up because you made the case',
          ],
          [
            '**Failure**',
            '"A mistake you made" · "A time you were wrong"',
            'Something that went wrong because of you, and what you changed',
          ],
          [
            '**Trade-off under pressure**',
            '"A decision with incomplete data" · "Speed or quality"',
            'A call made against the clock, with the cost you accepted named',
          ],
          [
            '**Growing others**',
            '"Mentoring" · "Raising the bar"',
            'Someone who can now do what they could not, or a practice the team kept',
          ],
          [
            '**Business impact**',
            '"Going beyond your role" · "A hard deadline"',
            'Work tied to a number the business cared about',
          ],
        ],
      },
      {
        kind: 'list',
        items: [
          '**Write each story as five bullet lines**, not prose: situation, task, two or three actions, the result with its number, the lesson. Bullets survive nerves; a memorised paragraph does not.',
          '**Tag each story with the two or three themes it serves.** An incident you led is a failure story, a trade-off story and, told from a different angle, an influence story.',
          '**Prefer the last two or three years.** An older story is fine if it is your best, but a senior candidate whose best work is five years old invites the obvious question.',
          '**Know your numbers cold.** Find the before-and-after now. Nothing sounds less senior than "it was faster — quite a lot, I think."',
          '**Keep a second story for the heavy themes.** "Tell me about another time" is a common follow-up when the first one is thin.',
        ],
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'An illustrative story',
        text: 'A hypothetical engineer notices that the nightly billing job has grown from forty minutes to five hours and now runs into the morning traffic peak. Told for **ambiguity**, the story is how she turned "billing is slow" into three measured causes. Told for **influence**, it is how she got the finance team to accept invoices an hour late while it was fixed. Told for **failure**, it is her first attempt — running the job in parallel — which double-charged eleven test accounts in staging and taught her to make each step idempotent first. One story, rehearsed once, answers three questions.',
      },
      { kind: 'heading', text: 'A mid-level answer and a senior answer' },
      {
        kind: 'prose',
        text: 'The question is "Tell me about a project you led." Same engineer, same project: moving a notifications service onto a new message queue. Everything that differs is in what gets said.',
      },
      {
        kind: 'compare',
        left: {
          title: 'Mid-level answer',
          points: [
            '"We needed to move notifications off the old queue, and I was asked to lead it."',
            '"I wrote the new consumer, set up the topics, and we tested it in staging."',
            '"We hit some duplicate messages, so we added deduplication."',
            '"It went live on time and it has worked well since."',
          ],
        },
        right: {
          title: 'Senior answer',
          points: [
            '"The old queue lost about one message in ten thousand under load, and three teams had each built a workaround. Nobody owned the fix, so I proposed that I would."',
            '"I wrote a one-page comparison of patching it against migrating. I chose to migrate, because the patch left the root cause in place, and got the three leads to sign off in one review."',
            '"I made every consumer idempotent before the cutover, ran both queues side by side for two weeks, and paired with one engineer from each team so they could own their consumers."',
            '"Lost messages went to zero over six months of monitoring, all three workarounds were deleted, and two of those engineers ran the next migration without me."',
          ],
        },
        verdict:
          'Same project. The senior answer adds the four signals — a problem nobody owned, three teams brought along, people who could repeat it without you, a before-and-after number — and it names the option it rejected, which is the cheapest depth signal in this round, just as it is in the design round.',
      },
      { kind: 'heading', text: 'Delivering it' },
      {
        kind: 'list',
        items: [
          '**Lead with the headline.** One sentence of stakes and role, then the detail. If you are interrupted at forty seconds, they should already know why it mattered.',
          '**Two to three minutes, then stop.** A longer answer does not score more; it spends the time the interviewer needed for follow-ups. Past three minutes, cut to the result.',
          '**Answer the question asked.** A project story with a conflict in minute two is the wrong answer to a conflict question. Pick the story where the conflict is the point.',
          '**End on the result and the lesson, then be quiet.** "What would you do differently?" is coming. Let it come.',
        ],
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Telling the team\'s story. "We decided, we built, we shipped" leaves the interviewer with nothing to write down about you, and they will not guess generously. The opposite trap costs as much: claiming every decision, then stumbling when asked who else was involved. "We" for the team, "I" for your part, and know exactly where the line was.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'What was your contribution, as opposed to the team\'s?',
            a: 'Name two or three decisions that were yours and one thing a teammate owned: "The design and the cutover plan were mine; Sam built the replay tooling and I reviewed it." Precision here is credibility. A vague answer suggests the story was borrowed.',
          },
          {
            q: 'How did you measure that it worked?',
            a: 'Give the metric, the baseline, and how long you watched it: "Lost messages per day, from about thirty to zero, on the dashboard we built for the migration, for six months." If you did not measure it, say what you used instead and what you would track now. Never invent a number — the next question will be about how you got it.',
          },
          {
            q: 'What would you do differently?',
            a: 'Name one real thing, with its cost: "I would have brought the mobile team in a month earlier. They found an ordering assumption late, and it cost us two weeks." "Nothing" is the wrong answer at any level, and a list of five is not much better.',
          },
          {
            q: 'What happened after you moved on from it?',
            a: 'This tests whether the result lasted and whether you built something other people could run. The strong answer names who owns it now and what they did with it: "The team that took it over used the same pattern for two more services."',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-i-star-1',
        moduleId: 'i-star',
        stem: 'You are three minutes into "tell me about a project you led" and have not reached the result. What do you do?',
        options: [
          'Keep going — the detail shows depth',
          'Cut to the result and its number, then stop',
          'Ask the interviewer whether they want more background',
          'Switch to a second, shorter story',
        ],
        correct: 1,
        explain:
          'Past three minutes you are spending the time the interviewer needs for follow-ups, which is where the level gets decided. Detail they want, they will ask for. Asking permission to keep talking hands them the job of managing your answer.',
      },
      {
        id: 'q-i-star-2',
        moduleId: 'i-star',
        stem: 'Which addition most raises the level of a project story?',
        options: [
          'More detail about the technology stack',
          'Saying "we" throughout, to show you are a team player',
          'The option you rejected and why, plus the number that moved',
          'A fuller description of the company and the team',
        ],
        correct: 2,
        explain:
          'A rejected alternative shows judgement, and a before-and-after number shows the result was real. Stack detail is mid-level signal at best, and "we" throughout leaves the interviewer nothing to attribute to you.',
      },
      {
        id: 'q-i-star-3',
        moduleId: 'i-star',
        stem: 'How big should a story bank be, and why?',
        options: [
          'Six to eight, because each story can be told from several angles to cover most themes',
          'About thirty, one per likely question, so nothing is improvised',
          'Two or three, polished until they are word-perfect',
          'None — prepared stories sound scripted',
        ],
        correct: 0,
        explain:
          'Each good story serves two or three themes, so six to eight covers what you will be asked. Thirty cannot be rehearsed to quality, two or three leave gaps, and no bank at all means improvising structure under pressure, which is exactly when stories go shapeless.',
      },
    ],
    cards: [
      {
        id: 'c-i-star-1',
        moduleId: 'i-star',
        front: 'What goes in each beat of a [[STAR]] answer?',
        back: 'Situation: the stakes, in two sentences. Task: what was yours. Action: most of the time, your decisions, said as "I". Result: a number, then one line of reflection.',
        tag: 'Behavioural',
      },
      {
        id: 'c-i-star-2',
        moduleId: 'i-star',
        front: 'Which four signals make a story senior?',
        back: 'Ambiguity you turned into a plan, impact beyond your own team, people who got better because of you, and a result with a before-and-after number.',
        tag: 'Behavioural',
      },
      {
        id: 'c-i-star-3',
        moduleId: 'i-star',
        front: 'How long should a behavioural answer run?',
        back: 'Two to three minutes, then stop. The follow-ups are where the level gets decided, and a long answer spends their time.',
        tag: 'Behavioural',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'i-influence',
    trackId: 'interview',
    title: 'Leading without authority, conflict and disagreement',
    station: 4,
    prereqs: ['i-star'],
    minutes: 14,
    summary:
      'Influence through evidence, disagree and commit, conflict with peers and managers, mentoring, and stakeholders.',
    objectives: [
      'Show influence that came from evidence and trust, not from a title',
      'Tell a conflict story about the problem rather than the person, ending with the relationship intact',
      'Use disagree and commit properly: argue fully, then execute fully',
      'Frame mentoring and stakeholder stories as outcomes, not activities',
    ],
    keywords: [
      'influence',
      'leading without authority',
      'conflict resolution',
      'disagree and commit',
      'pushback',
      'mentoring',
      'stakeholder management',
      'difficult coworker',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'A senior engineer is expected to change what other people do without being able to tell them to. Your peers do not report to you, the team next door has its own roadmap, and your manager can overrule you. Every question in this lesson — conflict, disagreement, mentoring, stakeholders — tests the same thing: how you get to a good outcome through people you do not control.',
      },
      {
        kind: 'prose',
        text: 'Interviewers are also screening for risk. A candidate who describes colleagues as obstacles, wins every argument, or has never once changed their mind is telling the interviewer what working with them will be like.',
      },
      {
        kind: 'figure',
        caption: 'Leading without authority as a loop. Each change you land makes the next one easier to land.',
        figure: {
          kind: 'cycle',
          steps: [
            { label: 'Understand their goal', sub: 'what they are measured on' },
            { label: 'Find the shared problem', sub: 'say it in their terms, not yours' },
            { label: 'Bring evidence', sub: 'a measurement, a prototype, a written proposal' },
            { label: 'Make yes cheap', sub: 'a pilot, a reversible first step' },
            { label: 'Give the credit away', sub: 'their win is your next yes' },
          ],
          note: 'Authority is a shortcut you do not have. Every turn of this loop builds the trust that makes the next turn shorter.',
        },
      },
      { kind: 'heading', text: 'Influence without a title' },
      {
        kind: 'prose',
        text: 'Authority lets you skip the argument. Without it you have three levers, and strong stories use all of them: **evidence** (a measurement, a prototype, a written comparison), **alignment** (how the change serves what the other team is already measured on) and **trust** (a record of being right, and of being fair when you were not).',
      },
      {
        kind: 'list',
        items: [
          '**Write it down.** A one-page proposal with options and a recommendation travels further than any meeting. People you never spoke to can read it, and writing it keeps your own reasoning honest.',
          '**Go one-to-one before the group.** Walk the most sceptical person through it privately first. An objection raised in a meeting hardens; one raised over coffee gets fixed.',
          '**Make the first step cheap.** A two-week pilot on one service is easier to agree to than a migration of forty. Make it reversible, and say so.',
          '**Let them own a piece.** People defend what they helped shape. Ask the sceptic to own the rollback plan.',
        ],
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'An illustrative story',
        text: 'A hypothetical senior engineer notices that eight teams call the payment provider directly, each with its own retry logic, and that a provider blip turns into duplicate charges about twice a quarter. She has no authority over any of them. She counts the duplicates for a month, writes a two-page proposal for one shared client with idempotency keys, and takes it to the most sceptical team lead first; his objection, added latency, becomes a requirement with a benchmark attached. One willing team pilots it, she publishes the before-and-after, and she offers to pair with whoever goes next. Five teams move within a quarter. The last three move after the next incident, on their own. In the interview, every sentence of that is evidence: measured, written down, de-risked, credited.',
      },
      { kind: 'heading', text: 'Disagree and commit' },
      {
        kind: 'prose',
        text: 'Amazon lists it as a leadership principle, and most large engineering organisations run on some version of it. While the decision is open, you argue your position fully, with evidence. Once it is made, you execute it as if it were your own. Both halves are being tested, and candidates tend to remember only the first.',
      },
      {
        kind: 'compare',
        left: {
          title: 'Disagree and comply',
          points: [
            'Raises the concern once, then goes quiet',
            'Ships the decision slowly, with "I told you so" ready',
            'Reopens it in every later meeting',
            'If it fails, the story becomes who was right',
          ],
        },
        right: {
          title: 'Disagree and commit',
          points: [
            'Makes the strongest case while the decision is open, in writing',
            'Says in advance what evidence would change their mind',
            'Once decided, executes fully and defends it to their own team',
            'Agrees a checkpoint to revisit it with data, not grievance',
          ],
        },
        verdict:
          'The tell of a strong answer is the checkpoint: "We agreed to look at the error rate after a month. It held, and I had overestimated the risk." Or: "It did not hold, and we switched, without anyone needing to win."',
      },
      {
        kind: 'prose',
        text: 'It has a limit, and naming the limit is a senior signal. If a decision is unsafe, unlawful, or harms users in a way they would not accept, you do not commit. You escalate, openly, and you tell the person you disagree with that you are doing it.',
      },
      { kind: 'heading', text: 'Conflict with a peer or a manager' },
      {
        kind: 'prose',
        text: 'The question is "Tell me about a time you disagreed with a colleague." The interviewer is listening for four things: the disagreement was about a real technical or product question; you understood the other side well enough to argue it; it was settled on the merits; and you still work well with that person.',
      },
      {
        kind: 'table',
        head: ['', 'With a peer', 'With your manager'],
        rows: [
          [
            '**What is tested**',
            'Whether you can settle it without a referee',
            'Whether you can push back and still be managed',
          ],
          [
            '**The strong move**',
            'Agree the criteria first, then compare the options against them',
            'Bring the data privately, propose an alternative, accept the call',
          ],
          [
            '**When to escalate**',
            'Together, with both positions written down, when the criteria themselves conflict',
            'When the concern is safety, ethics or the law, and say so openly',
          ],
          [
            '**What loses**',
            '"I went to their manager" as the first move',
            '"I did it my way anyway"',
          ],
        ],
      },
      {
        kind: 'figure',
        caption: 'Two ways the same disagreement runs. Only one of them is a story worth telling in an interview.',
        figure: {
          kind: 'split',
          left: {
            title: 'About the person',
            tone: 'alert',
            nodes: [
              { label: 'Positions', sub: 'mine against theirs', to: 'argue' },
              { label: 'Someone wins', tone: 'alert', to: 'and' },
              { label: 'Trust spent', sub: 'next time is harder', tone: 'alert' },
            ],
            cost: 'Even when you are right, the interviewer hears a colleague they would have to manage around.',
          },
          right: {
            title: 'About the problem',
            tone: 'mastered',
            nodes: [
              { label: 'Shared criteria', sub: 'agreed first', to: 'then' },
              { label: 'Options compared', sub: 'against the criteria', to: 'so' },
              { label: 'Decision stands', sub: 'whoever proposed it', tone: 'mastered' },
            ],
            cost: 'Slower to start. Faster to finish, and the relationship survives it.',
          },
          verdict:
            'Agreeing what you are optimising for turns a contest of opinions into a comparison anyone can check.',
        },
      },
      {
        kind: 'callout',
        tone: 'say',
        text: 'Make the other side sound reasonable, because it usually was: "Her concern was fair — her team had been paged for the last two schema changes." An interviewer cannot trust your judgement of a conflict if the other person in it sounds like a fool.',
      },
      { kind: 'heading', text: 'One conflict, four framings' },
      {
        kind: 'prose',
        text: 'The facts never change: you and a tech lead on another team disagreed about whether a new service should share his team\'s Postgres database or own its own store. Only the framing moves, and the framing is what gets graded.',
      },
      {
        kind: 'ladder',
        rungs: [
          {
            grade: 'bad',
            title: 'Red flag: the villain story',
            text: '"He insisted on sharing his database and would not listen, so I took it to our director, who agreed with me." You won, he lost, and a manager had to settle it. The interviewer hears someone who cannot resolve conflict, and who will describe them this way one day.',
          },
          {
            grade: 'good',
            title: 'Mid-level: the quiet compromise',
            text: '"We disagreed, so we met in the middle: one cluster, separate schemas." Calm and resolved, but there is no reasoning in it. Was the compromise right, or only quiet?',
          },
          {
            grade: 'great',
            title: 'Senior: agree the criteria first',
            text: '"Before arguing options, I asked what we were optimising for. We agreed on two things: each team deploys on its own schedule, and neither can block the other\'s schema changes. Against those, a separate store won, and he drafted the migration plan." The conflict is now about the problem, and it was settled on the merits.',
          },
          {
            grade: 'best',
            title: 'Staff: argue their side, then pay for it',
            text: '"His real worry was operational: every new database ended up on his team\'s pager. That was fair, so our plan put the new store on my team\'s on-call, with a runbook his team reviewed. Six months on, neither team has blocked the other, and he asked me to review his next design." You stated his concern better than he did, paid for it instead of dismissing it, and the relationship came out stronger.',
          },
        ],
      },
      { kind: 'heading', text: 'Mentoring and raising others' },
      {
        kind: 'prose',
        text: 'Mentoring answers fail by describing activity: "I held weekly one-to-ones and reviewed a lot of code." The interviewer wants an outcome in someone else — a person who can now do something they could not, or a practice the team kept after you stopped pushing it.',
      },
      {
        kind: 'list',
        items: [
          '**Name the gap you saw.** "She wrote excellent code but froze in design reviews."',
          '**Say what you did for this person.** Not a generic programme: "I had her present the design, and I took the hard questions only if she asked me to."',
          '**Show the result in them, not in you.** "Two quarters later she led the review for the billing redesign, and I was not in the room."',
          '**Let it scale.** The staff version is a practice: "I wrote down how we run design reviews, and the two teams next to us adopted it."',
        ],
      },
      { kind: 'heading', text: 'Managing stakeholders' },
      {
        kind: 'prose',
        text: 'Product managers, other teams, support, finance: people who depend on what you are building and cannot see how it is going. The senior skill is no surprises. Bad news delivered early, with options, is a stakeholder story. The same news delivered on the deadline is a failure story.',
      },
      {
        kind: 'figure',
        caption: 'Bad news early, with options, is a stakeholder story. The same news on the deadline is a failure story.',
        figure: {
          kind: 'timeline',
          ticks: ['week 1', 'week 2', 'week 3', 'week 4', 'week 5', 'week 6'],
          lanes: [
            {
              label: 'Raised on the deadline',
              bars: [
                { from: 0.25, to: 0.94, label: 'knew, said nothing', tone: 'streak' },
                { from: 0.94, to: 1, tone: 'alert' },
              ],
              outcome: { label: 'surprise', tone: 'alert' },
            },
            {
              label: 'Raised when you knew',
              bars: [
                { from: 0.25, to: 0.38, label: 'raised', tone: 'line' },
                { from: 0.38, to: 1, label: 'new plan, agreed', tone: 'mastered' },
              ],
              outcome: { label: 'trade chosen', tone: 'mastered' },
            },
          ],
          note: 'The same slip, found on the same day. The only difference is how long the stakeholder had to choose what to give up.',
        },
      },
      {
        kind: 'prose',
        text: 'When you raise a slip, bring two or three options with their costs — cut this feature, move the date a fortnight, borrow one named engineer from another team — and let the stakeholder choose. It is their trade to make. Your job is to make it a clear one, and to confirm the choice in writing so nobody remembers it differently in a month.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Two answers that lose this question outright. "I do not really have conflicts with people" reads as avoidance, or as never having owned anything contested. And the story where you won every argument is either trivial or not quite true, and the interviewer will assume one of the two. Have a real disagreement ready, and at least one where the other person turned out to be right.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'What would you have done if they still had not agreed?',
            a: 'Show a next step that is not simply going over their head: "I would have proposed we each write up our option against the agreed criteria and take both to our leads together, so the decision was about the trade-off and not about us." Escalating jointly, with both positions on paper, is healthy. Escalating around someone is not.',
          },
          {
            q: 'Looking back, was there anything right about their position?',
            a: 'There should be, and you should say it without being pushed: "Yes. The operational load was real, and our first plan ignored it. That is why we took the on-call." A candidate who cannot find merit in the other side has not understood the disagreement.',
          },
          {
            q: 'How is the relationship now?',
            a: 'Give evidence, not a feeling: "We review each other\'s designs, and he pulled me into the next migration." If it ended badly, say so and say what you would do differently. Interviewers respect that far more than a tidy ending that does not survive the next question.',
          },
          {
            q: 'Tell me about a time you disagreed with your manager and lost.',
            a: 'Have this one ready; it is a direct test of disagree and commit. Show the case you made, the decision going the other way, and you executing it properly — then what happened. If the decision proved right, say what you learned. If it proved wrong, show how you reopened it with data rather than with "I told you so".',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-i-influence-1',
        moduleId: 'i-influence',
        stem: 'Your manager decides against your recommendation after hearing your case. What does disagree and commit ask of you?',
        options: [
          'Comply, but record your objection so it is on file if the decision fails',
          'Execute it fully as if it were your own, with an agreed checkpoint to revisit on data',
          'Keep raising it in later meetings until the evidence changes their mind',
          'Escalate to their manager, since you believe the decision is wrong',
        ],
        correct: 1,
        explain:
          'Committing means executing properly and defending the decision to your team; the checkpoint is how the disagreement gets settled by evidence later. Keeping a paper trail or reopening it every week is complying, not committing, and interviewers know the difference.',
      },
      {
        id: 'q-i-influence-2',
        moduleId: 'i-influence',
        stem: 'In a story about a conflict with a peer, which move most clearly shows senior judgement?',
        options: [
          'Escalating early so the conflict does not delay the project',
          'Finding a compromise both sides can live with',
          'Agreeing the criteria first, then comparing the options against them',
          'Deferring to the other person to keep the peace',
        ],
        correct: 2,
        explain:
          'Agreed criteria turn a contest of opinions into a comparison either side can check, so the outcome rests on the merits. A compromise can be right, but on its own it shows no reasoning. Escalating first and deferring both avoid the conflict rather than resolve it.',
      },
      {
        id: 'q-i-influence-3',
        moduleId: 'i-influence',
        stem: 'Which mentoring answer is strongest?',
        options: [
          '"I held weekly one-to-ones with three junior engineers for a year."',
          '"I reviewed most of the team\'s pull requests and left detailed comments."',
          '"I ran an internal course on distributed systems for the whole floor."',
          '"She froze in design reviews, so I had her lead them with me as backup. Six months later she ran the billing review alone."',
        ],
        correct: 3,
        explain:
          'It names a specific gap, the specific thing you did for that person, and an outcome in them that no longer depends on you. The others describe activity — time spent, comments left, a course run — with no evidence that anyone can now do something new.',
      },
    ],
    cards: [
      {
        id: 'c-i-influence-1',
        moduleId: 'i-influence',
        front: 'What does disagree and commit actually require?',
        back: 'Argue fully, in writing, while it is open. Once decided, execute it as your own and defend it to your team, with a checkpoint to revisit on data.',
        tag: 'Behavioural',
      },
      {
        id: 'c-i-influence-2',
        moduleId: 'i-influence',
        front: 'What moves a conflict story from mid-level to senior?',
        back: 'Agree the criteria before arguing options, state the other side fairly, settle it on the merits, and show the relationship intact afterwards.',
        tag: 'Behavioural',
      },
      {
        id: 'c-i-influence-3',
        moduleId: 'i-influence',
        front: 'What does a strong mentoring answer show?',
        back: 'A specific gap in a specific person, what you did differently for them, and an outcome in them that no longer needs you.',
        tag: 'Behavioural',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 'i-failure',
    trackId: 'interview',
    title: 'Failure, ownership and trade-off stories',
    station: 5,
    prereqs: ['i-influence'],
    related: ['o-slo'],
    minutes: 14,
    summary:
      'Owning a real mistake, being wrong well, deciding under pressure, and showing the behaviour you changed afterwards.',
    objectives: [
      'Choose a failure that was real, yours and recoverable, and tell it without deflecting',
      'Answer "a time you were wrong" with the evidence that changed your mind',
      'Tell a trade-off story that names the cost you accepted and why',
      'Make the lesson concrete: a mechanism that changed, with proof it held',
    ],
    keywords: [
      'failure story',
      'mistake',
      'ownership',
      'time you were wrong',
      'blameless postmortem',
      'incident',
      'trade-off decision',
      'lessons learned',
    ],
    lesson: [
      {
        kind: 'prose',
        text: 'The failure question is the one candidates prepare least and fear most, and it is the one that best separates levels. Everyone has made mistakes. What the interviewer is measuring is what happened next: whether you see your own part clearly, whether you fixed the system and not just the symptom, and whether you behave differently now.',
      },
      {
        kind: 'prose',
        text: 'A senior engineer is trusted with things that can go badly wrong. The interviewer needs evidence that when they do, you will say so early, own your part, and leave things safer than you found them.',
      },
      {
        kind: 'figure',
        caption: 'A failure story is a [[STAR]] answer whose result is a change in how you work.',
        figure: {
          kind: 'flow',
          nodes: [
            { label: 'What went wrong', sub: 'specific, with the impact' },
            { label: 'My part in it', sub: 'said plainly, once', tone: 'line' },
            { label: 'What I did then', sub: 'contain, fix, tell people' },
            { label: 'What I changed', sub: 'a mechanism, not a promise', tone: 'mastered' },
            { label: 'Proof it held', sub: 'it caught the next one' },
          ],
          note: 'Spend most of the time on the last two boxes. The incident is the set-up; the change is the answer.',
        },
      },
      { kind: 'heading', text: 'Choosing the failure' },
      {
        kind: 'prose',
        text: 'The right failure is **real** (it cost time, money, users or trust), **yours** (your decision or your miss, not the team\'s or a vendor\'s) and **old enough to have a sequel** (you can show what you changed and that it held). It must not be a catastrophe that calls your judgement for this role into question, and it must not be a boast in disguise.',
      },
      {
        kind: 'compare',
        left: {
          title: 'Failures that lose',
          points: [
            '**The humble-brag.** "I care too much about quality." The interviewer hears an evasion.',
            '**Someone else\'s failure.** The vendor, the other team, the unclear spec. You were only nearby.',
            '**The trivial one.** A typo caught in review. Nothing was at stake, so nothing was learned.',
            '**The disqualifying one.** A security warning ignored for months. True, but it answers a different question.',
          ],
        },
        right: {
          title: 'Failures that work',
          points: [
            '**A call that turned out wrong.** You shipped without a load test to hit a date, and the launch fell over.',
            '**Something you missed.** A migration planned without a rollback step, which you then needed.',
            '**A people mistake.** You let a struggling project run a month too long before raising it.',
            '**Each has a sequel.** A change you made afterwards that you can point to.',
          ],
        },
        verdict:
          'Pick something with real cost that you personally caused, from far enough back that the change you made has had time to prove itself.',
      },
      { kind: 'heading', text: 'Owning it, without the hedges' },
      {
        kind: 'prose',
        text: 'Ownership is mostly grammar. Listen for the passive voice and the plural in your own draft — "mistakes were made", "we missed it" — and replace them with what you did. Then stop. One clear sentence of ownership is stronger than three of apology.',
      },
      {
        kind: 'table',
        head: ['Deflecting', 'Owning'],
        rows: [
          ['"The requirements were unclear."', '"I did not push to clarify the requirements, and I should have."'],
          ['"Testing did not catch it."', '"I skipped the load test to hit the date. That was my call."'],
          ['"There was a miscommunication."', '"I told support in one Slack message and never checked it had landed."'],
          ['"Mistakes were made during the rollout."', '"I rolled it out to every region at once instead of one."'],
          ['"In hindsight, it was not ideal."', '"It caused forty minutes of failed checkouts."'],
        ],
      },
      { kind: 'heading', text: 'A time you were wrong' },
      {
        kind: 'prose',
        text: 'This is a different question from the failure question, and treating them as one wastes it. A failure is an outcome that went badly. Being wrong is a belief you held and then changed. The interviewer wants to see how you update: what the evidence was, how quickly you accepted it, and what you did with your earlier position.',
      },
      {
        kind: 'list',
        items: [
          '**Say what you believed, and why it was reasonable.** "I was sure the slowdown was the database, because it had been the cause twice before."',
          '**Name the evidence that changed your mind.** "The trace showed most of each request spent serialising one oversized response."',
          '**Show the speed of the update.** "I posted in the incident channel that I had been wrong and that we should stop the database work." Changing your mind quickly, and in public, is the signal.',
          '**Say what still held.** Being wrong about the cause is not being wrong about everything. Strong answers say which part of the earlier reasoning survived.',
        ],
      },
      { kind: 'heading', text: 'Trade-offs under pressure' },
      {
        kind: 'prose',
        text: '"A decision you made with incomplete information." "A time you had to choose between speed and quality." These test whether you can decide at all, and whether you knew what you were trading. The strong answer names the options, the cost of each, why you picked one, and what you did to limit the downside. It does not need to have turned out well.',
      },
      {
        kind: 'prose',
        text: 'The most useful distinction to carry in is reversibility. Amazon\'s shareholder letters call them one-way and two-way doors: a decision that is cheap to undo should be made fast, by whoever is closest; one that cannot be undone deserves the slow, careful process. Saying which kind of door you faced, and that you sped up or slowed down because of it, is a senior answer in one sentence.',
      },
      {
        kind: 'figure',
        caption: 'How reversible a decision is should set how fast you make it.',
        figure: {
          kind: 'split',
          left: {
            title: 'One-way door',
            tone: 'streak',
            nodes: [
              { label: 'Hard to undo', sub: 'data deleted, contract signed', to: 'so' },
              { label: 'Slow down', sub: 'more data, a second reviewer', tone: 'streak' },
            ],
            cost: 'Costs days. Worth it when a wrong call cannot be walked back.',
          },
          right: {
            title: 'Two-way door',
            tone: 'mastered',
            nodes: [
              { label: 'Cheap to undo', sub: 'a flag, a config value, a rollback', to: 'so' },
              { label: 'Decide now', sub: 'with a date to revisit', tone: 'mastered' },
            ],
            cost: 'Sometimes wrong. Being wrong cheaply beats being slow at everything.',
          },
          verdict:
            'Under pressure, the senior move is often to turn a one-way door into a two-way one — ship behind a flag, keep the old path running — and then decide quickly.',
        },
      },
      {
        kind: 'callout',
        tone: 'example',
        title: 'An illustrative story',
        text: 'A hypothetical tech lead is two days from a launch tied to a partner\'s marketing campaign when load tests show the new search service falling over at twice the expected traffic. A proper fix is a week. She writes three options for her director: slip the launch, launch with the new search behind a flag and the old one as fallback, or launch as is. She recommends the flag, a two-way door, and accepts weaker results for a week. Launch traffic reaches three times the forecast; the flag flips to the old path for forty minutes, and users see slower search instead of errors. The fix ships six days later. Her lesson is not "load test earlier", which everyone says. It is that the forecast was the partner\'s number and nobody had tested it, so every launch plan she writes now carries a range instead of a single figure.',
      },
      { kind: 'heading', text: 'Blameless postmortems' },
      {
        kind: 'prose',
        text: 'Many failure stories are incidents, so expect "how did you run the postmortem?" The practice comes from safety culture in aviation and medicine, and was popularised in software by Etsy and by Google\'s site reliability engineering book: assume everyone acted reasonably given what they knew at the time, and look for the conditions that made the mistake easy. Blameless does not mean nobody is accountable. It means the output is a change to the system, not a name.',
      },
      {
        kind: 'figure',
        caption: 'A blameless postmortem as a loop. Each incident should leave the system harder to break the same way.',
        figure: {
          kind: 'cycle',
          steps: [
            { label: 'Timeline', sub: 'what happened, minute by minute, from the logs' },
            { label: 'Contributing factors', sub: 'why each step seemed reasonable at the time' },
            { label: 'Action items', sub: 'owned, dated, and mostly mechanisms' },
            { label: 'Follow-through', sub: 'tracked to done, checked weeks later' },
            { label: 'Share it', sub: 'other teams learn without the outage' },
          ],
          note: 'The loop closes when the next incident is caught earlier or never happens. An action item nobody tracks is a feeling, not a fix.',
        },
      },
      {
        kind: 'list',
        items: [
          '**Ask why it was easy to get wrong**, not who did it. A config change that took production down says more about the missing validation than about the person who typed it.',
          '**Separate the trigger from the causes.** The bad deploy is the trigger. No canary, no alert on error rate, and a runbook nobody had tried are the causes.',
          '**Prefer mechanisms to intentions.** "Be more careful" is not an action item. "Config changes go through the same review and staged rollout as code" is.',
          '**If it was your mistake, say so in the room.** The most useful thing a senior engineer can do for a blameless culture is go first.',
        ],
      },
      { kind: 'heading', text: 'Making the lesson concrete' },
      {
        kind: 'prose',
        text: 'Every failure story ends with a lesson, and most lessons are worthless: "I learned to communicate better." The interviewer cannot check it, and neither can you. A concrete lesson is a behaviour or a mechanism, with evidence that it is still in place.',
      },
      {
        kind: 'ladder',
        rungs: [
          {
            grade: 'bad',
            title: 'An intention',
            text: '"I learned to be more careful with migrations." Nobody can observe careful. It sounds like the lesson every candidate gives, because it is.',
          },
          {
            grade: 'good',
            title: 'A personal rule',
            text: '"Now I always write a rollback plan before a migration." Specific and checkable, but it relies on you remembering under the same pressure that caused the first failure.',
          },
          {
            grade: 'great',
            title: 'A mechanism',
            text: '"I added a rollback section to our migration template, and reviewers block a plan without one." It no longer depends on you. That is the senior instinct: fix the system, not only yourself.',
          },
          {
            grade: 'best',
            title: 'A mechanism, with proof it worked',
            text: '"Since then the template has caught two plans with no rollback, and we needed one of them. Two other teams copied it." It held, it caught something, and it spread. This is the answer to "what did you learn?" that ends the line of questioning.',
          },
        ],
      },
      {
        kind: 'callout',
        tone: 'say',
        text: '"That was my call, and it was the wrong one. Here is what I changed so it cannot happen the same way again." One sentence of ownership, then straight to the mechanism. Do not apologise three times, and do not explain why it was not really your fault.',
      },
      {
        kind: 'callout',
        tone: 'trap',
        text: 'Spending the whole answer on the incident. The outage is the most vivid part, so candidates relive it minute by minute and reach "what I learned" with fifteen seconds left — and the lesson is the part being scored. Give the failure about a third of the time, and what you did about it and what changed the other two thirds.',
      },
      {
        kind: 'followups',
        items: [
          {
            q: 'What would you do differently?',
            a: 'Name the decision point, not the whole project: "When the load test failed, I would have slipped two days rather than launch behind a fallback we had never rehearsed." Specific enough to show you have replayed it, small enough to show you would not throw out the whole approach.',
          },
          {
            q: 'How do you know the change worked?',
            a: 'Point at evidence that exists without you: the gate that blocked a later launch, the alert that fired early in the next incident, the template another team copied. "It has not happened again" is weak on its own, because absence is easy to claim and hard to verify.',
          },
          {
            q: 'Whose fault was it, really?',
            a: 'Do not take the bait in either direction. Say your part plainly, then the conditions that made it easy: "My decision, made easy by a launch process with no load-test gate. I fixed both." Blaming others fails, and taking all the blame for a systemic problem misses the systemic fix.',
          },
          {
            q: 'Have you ever made the same mistake twice?',
            a: 'An honest "yes, once" with what finally made it stick beats a claim of perfection: "The first time I made myself a rule, and it did not survive the next deadline. The second time I built it into the pipeline, and that held." It shows exactly why mechanisms beat intentions.',
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-i-failure-1',
        moduleId: 'i-failure',
        stem: 'Which "lesson learned" is strongest at the end of a failure story?',
        options: [
          '"I learned how important it is to communicate early."',
          '"I now always write a rollback plan before I migrate anything."',
          '"I learned never to rush a launch again."',
          '"I added a rollback section to the migration template that reviewers enforce. It has since caught two plans."',
        ],
        correct: 3,
        explain:
          'A mechanism with evidence that it worked does not depend on you remembering under pressure, and it can be checked. A personal rule beats an intention, but it is the kind of lesson that fails under the same deadline that caused the first failure.',
      },
      {
        id: 'q-i-failure-2',
        moduleId: 'i-failure',
        stem: 'You are asked for a failure. Which story should you tell?',
        options: [
          'A vendor outage that took your service down for an afternoon',
          'A launch you shipped without a load test to hit a date, which then fell over',
          'A quarter when you worked too many late nights and burned out',
          'A typo you caught during your own code review',
        ],
        correct: 1,
        explain:
          'It is real, it is yours, and it has a sequel you can show. The vendor outage was not your failure, the late nights are a boast in disguise, and the typo had nothing at stake, so none of them shows how you respond to a real mistake.',
      },
      {
        id: 'q-i-failure-3',
        moduleId: 'i-failure',
        stem: 'Under deadline pressure you must choose between two designs, and there is no time to gather more data. What makes the answer senior?',
        options: [
          'Naming how reversible each option is, and making the risky one reversible before committing',
          'Picking the lowest-risk option, whatever it costs',
          'Escalating so a director makes the call',
          'Delaying until there is enough data to be sure',
        ],
        correct: 0,
        explain:
          'Reversibility sets how much care a decision deserves. Turning a one-way door into a two-way one — a flag, the old path kept running — lets you move fast and still recover. "Lowest risk at any cost" and "wait for certainty" both ignore that delay has a cost too, and escalating hands away the judgement being tested.',
      },
    ],
    cards: [
      {
        id: 'c-i-failure-1',
        moduleId: 'i-failure',
        front: 'What makes a failure worth telling in an interview?',
        back: 'Real cost, your own decision or miss, and a sequel: a change you made afterwards, with evidence that it held.',
        tag: 'Behavioural',
      },
      {
        id: 'c-i-failure-2',
        moduleId: 'i-failure',
        front: 'What turns a lesson learned into evidence?',
        back: 'A mechanism rather than an intention — a check, a gate, a template — with proof it has since caught something.',
        tag: 'Behavioural',
      },
      {
        id: 'c-i-failure-3',
        moduleId: 'i-failure',
        front: 'What does blameless mean in a postmortem?',
        back: 'Assume people acted reasonably on what they knew, ask why the mistake was easy, and fix those conditions. Accountability stays; the output is a change, not a name.',
        tag: 'Behavioural',
      },
    ],
  },
]
