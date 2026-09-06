import { Link } from 'react-router-dom'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium select-none ' +
  'transition-[background-color,border-color,color,opacity] duration-150 ' +
  'disabled:opacity-40 disabled:pointer-events-none active:scale-[0.985] ' +
  'motion-reduce:active:scale-100'

const variants: Record<Variant, string> = {
  primary: 'bg-line text-line-ink hover:opacity-90',
  secondary: 'bg-surface text-ink border border-hairline hover:border-line',
  ghost: 'text-ink-2 hover:text-ink hover:bg-surface-2',
  danger: 'bg-alert-soft text-alert border border-alert/30 hover:border-alert',
}

// Minimum 44px tall throughout — the touch-target floor, not a style choice.
const sizes: Record<Size, string> = {
  md: 'min-h-11 px-4 text-[0.9375rem]',
  lg: 'min-h-13 px-5 text-base w-full',
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
