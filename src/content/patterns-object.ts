import type { Pattern } from './types'

/**
 * Design patterns as recognition entries — the "object" family. Same shape as the system
 * patterns: the tell in a prompt that should make you reach for it, and the move.
 * Ids are fixed (LLD problems reference them): strategy, state, observer, factory, builder,
 * singleton, adapter, decorator, composite, command, template-method,
 * chain-of-responsibility, facade, proxy.
 */
export const objectPatterns: Pattern[] = []
