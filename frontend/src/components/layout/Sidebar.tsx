import { NavLink } from 'react-router-dom'

export function Sidebar() {
  const navItems = [
    { label: 'Pipeline & ATS scoring', path: '/pipeline' },
    { label: 'Candidates & resumes', path: '/candidates' },
    { label: 'Job postings', path: '/jobs' },
    { label: 'Team & roles', path: '/team' },
    { label: 'Audit logs', path: '/audit' }
  ]

  return (
    <aside style={{
      width: '240px',
      backgroundColor: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      padding: '1.5rem 0',
      flexShrink: 0
    }}>
      {/* Brand Header: Simple Serif Wordmark */}
      <div style={{ padding: '0 1.25rem', marginBottom: '2rem' }}>
        <div style={{
          fontFamily: "var(--font-serif, 'Source Serif 4', Georgia, serif)",
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--ink-primary)',
          letterSpacing: '-0.025em',
          lineHeight: 1.1
        }}>
          Hirely
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '0.25rem' }}>Enterprise ATS</div>
      </div>

      {/* Navigation Section */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', flex: 1 }}>
        <div style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'var(--ink-muted)',
          padding: '0 1.25rem 0.5rem',
        }}>
          Workspace
        </div>

        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => (isActive ? 'active-nav-link' : '')}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--ink-primary)' : 'var(--ink-muted)',
              backgroundColor: 'transparent',
              borderLeft: isActive ? '3px solid var(--accent-navy)' : '3px solid transparent',
              textDecoration: 'none',
              transition: 'color 0.15s ease, border-color 0.15s ease'
            })}
          >
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Workspace Footer Info */}
      <div style={{
        marginTop: 'auto',
        margin: '1.25rem 1rem 0',
        padding: '0.875rem',
        backgroundColor: 'var(--bg-canvas)',
        borderRadius: '4px',
        border: '1px solid var(--border-color)',
        fontSize: '0.75rem',
        color: 'var(--ink-muted)'
      }}>
        <div style={{ fontWeight: 600, color: 'var(--ink-primary)', marginBottom: '0.15rem' }}>Enterprise Roster</div>
        <div>Multi-tenant ATS Engine</div>
      </div>
    </aside>
  )
}
