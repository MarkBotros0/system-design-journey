import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

/**
 * Which glossary term is open, and nothing else.
 *
 * State only — no rendering, no Figure import. The sheet lives in GlossarySheet.tsx and
 * is mounted once by App. Keeping them apart avoids an import cycle: Figure renders
 * Inline, which renders Abbr, which needs this context. If the sheet lived here, that
 * chain would close back on Figure.
 */

interface GlossaryContextValue {
  openId: string | null
  open: (id: string) => void
  close: () => void
}

const GlossaryContext = createContext<GlossaryContextValue | null>(null)

export function GlossaryProvider({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null)

  const open = useCallback((id: string) => setOpenId(id), [])
  const close = useCallback(() => setOpenId(null), [])

  const value = useMemo(() => ({ openId, open, close }), [openId, open, close])

  return <GlossaryContext.Provider value={value}>{children}</GlossaryContext.Provider>
}

export function useGlossary(): GlossaryContextValue {
  const ctx = useContext(GlossaryContext)
  if (!ctx) throw new Error('useGlossary must be used inside <GlossaryProvider>')
  return ctx
}
