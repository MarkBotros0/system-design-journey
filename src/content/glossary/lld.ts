import type { GlossaryEntry } from '../glossary'

/** Glossary entries added by the lld content author. Same shape and rules as glossary.ts. */
export const terms: GlossaryEntry[] = [
  {
    id: 'UML',
    full: 'Unified Modeling Language',
    gist: 'The standard notation for drawing software structure: classes as boxes of fields and methods, relationships as arrows and diamonds. An interview wants a readable subset of it, not the full specification.',
    figure: {
      kind: 'classes',
      classes: [
        { name: 'Shape', stereotype: 'interface', methods: ['area(): number'], tone: 'line' },
        { name: 'Circle', fields: ['radius: number'], methods: ['area(): number'] },
        { name: 'Drawing', fields: ['shapes: Shape[]'], methods: ['render(): void'] },
      ],
      relations: [
        { from: 'Circle', to: 'Shape', kind: 'implements' },
        { from: 'Drawing', to: 'Shape', kind: 'has', label: 'holds many' },
      ],
    },
    caption: 'The subset interviews use: a box per class, its key fields and methods, and labelled arrows between them.',
    seeAlso: ['GRASP', 'LLD'],
  },
  {
    id: 'GRASP',
    full: 'General Responsibility Assignment Software Patterns',
    gist: 'Craig Larman\'s nine principles for deciding which class should do what. Information expert, creator and controller settle almost every placement in an interview; the rest explain why those three work.',
    figure: {
      kind: 'stack',
      layers: [
        { label: 'Information expert', sub: 'the class with the data', tone: 'line' },
        { label: 'Creator', sub: 'whoever contains or records it', tone: 'line' },
        { label: 'Controller', sub: 'one entry point per operation', tone: 'line' },
        { label: 'Low coupling, high cohesion', sub: 'the goals', tone: 'neutral' },
        { label: 'Polymorphism, protected variations', sub: 'absorb change', tone: 'neutral' },
        { label: 'Pure fabrication, indirection', sub: 'invent a home', tone: 'neutral' },
      ],
      note: 'Nine principles in all. The top three do most of the work.',
    },
    caption: 'The nine principles, with the three that place most behaviour at the top.',
    seeAlso: ['UML'],
  },
  {
    id: 'LLD',
    full: 'Low-Level Design',
    gist: 'The interview round, also called object-oriented design or machine coding, where a prompt such as "design a parking lot" becomes classes, methods and working code. Its sibling, system design, works one level up, in services and machines.',
    figure: {
      kind: 'flow',
      nodes: [
        { label: 'Prompt', sub: '"design a parking lot"', to: 'clarify' },
        { label: 'Objects', sub: 'the nouns', to: 'relate' },
        { label: 'Classes', sub: 'fields, methods', tone: 'line', to: 'implement' },
        { label: 'Key methods', sub: 'real code', tone: 'line', to: 'harden' },
        { label: 'Extend and make safe', sub: 'new types, races', tone: 'mastered' },
      ],
    },
    caption: 'The round in one line: from a vague prompt to classes and the code that carries the rules.',
    seeAlso: ['UML', 'GRASP'],
  },
]
