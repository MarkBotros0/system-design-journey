import { Link } from 'react-router-dom'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'md' | 'lg'

// Pills with a physical press: a slight shrink that reduced motion switches off.
const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold select-none ' +
  'transition-[background-color,color,opacity,transform] duration-150 ' +
  'disabled:opacity-40 disabled:pointer-events-none active:scale-[0.97] ' +
  'motion-reduce:active:scale-100'

const variants: Record<Variant, string> = {
  primary: 'bg-line text-line-ink hover:opacity-90',
  secondary: 'bg-surface-3 text-ink hover:bg-hairline',
  ghost: 'text-ink-2 hover:text-ink hover:bg-surface-2',
  danger: 'bg-alert-soft text-alert hover:opacity-90',
}

// Minimum 44px tall throughout — the touch-target floor, not a style choice.
const sizes: Record<Size, string> = {
  md: 'min-h-11 px-5 text-[0.9375rem]',
  lg: 'min-h-14 px-6 text-base w-full',
}

interface CommonProps {
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
      {children}
    </button>
  )
}

/** An icon-only control. Always labelled; always at least 44×44. */
export function IconButton({
  label,
  children,
  className = '',
  ...rest
}: { label: string; children: ReactNode; className?: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink transition-[background-color,transform] duration-150 hover:bg-surface-3 active:scale-95 motion-reduce:active:scale-100 ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export function ButtonLink({
  to,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
}: CommonProps & { to: string }) {
  return (
    <Link to={to} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </Link>
  )
}
