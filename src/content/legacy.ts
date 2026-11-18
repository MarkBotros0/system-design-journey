/**
 * The line as it was before routes existed: 25 stations, strictly in order. Frozen.
 *
 * Only the v1 → v2 progress migration reads this — it puts an existing learner's start
 * pointer on the first station they had not passed, so new tracks inserted earlier in
 * the journey never send them backwards. Never edit; new modules do not belong here.
 */
export const LEGACY_LINE: readonly string[] = [
  'f-what', 'f-network', 'f-api', 'f-db', 'f-storage', 'f-cache', 'f-scale',
  'c-framework', 'c-requirements', 'c-modelling', 'c-caching', 'c-sharding', 'c-cap', 'c-queues', 'c-search',
  'a-realtime', 'a-longrunning', 'a-contention', 'a-reads', 'a-writes', 'a-blobs', 'a-multistep', 'a-proximity',
  'i-room', 'i-recognition',
]
