'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Nav() {
  const pathname = usePathname()

  return (
    <nav style={{ borderBottom: '1px solid var(--color-border)' }}>
      <div className="max-w-2xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: 'var(--color-uw-red)' }}
          />
          <span
            className="text-xs font-black tracking-[0.18em] uppercase"
            style={{ color: 'var(--foreground)', letterSpacing: '0.18em' }}
          >
            Madgrades
          </span>
          <span
            className="text-xs font-semibold tracking-wider"
            style={{ color: 'var(--color-muted)' }}
          >
            DLE
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          <NavLink href="/" active={pathname === '/'}>
            <span className="sm:hidden">H / L</span>
            <span className="hidden sm:inline">Higher / Lower</span>
          </NavLink>
          <NavLink href="/trivia" active={pathname === '/trivia'}>Trivia</NavLink>
        </div>
      </div>
    </nav>
  )
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
      style={{
        color: active ? 'var(--foreground)' : 'var(--color-muted)',
        background: active ? 'var(--color-surface)' : 'transparent',
      }}
    >
      {children}
    </Link>
  )
}
