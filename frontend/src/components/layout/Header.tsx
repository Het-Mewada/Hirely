import { Button } from '../ui/button'
import { Sun, Moon, KeyRound } from 'lucide-react'

interface HeaderProps {
  authResponse: any
  onLogout: () => void
  onOpenPricingModal: () => void
  onOpenManageModal: () => void
  onOpenChangePasswordModal?: () => void
  theme?: 'light' | 'dark'
  onToggleTheme?: () => void
}

export function Header({
  authResponse,
  onLogout,
  onOpenPricingModal,
  onOpenManageModal,
  onOpenChangePasswordModal,
  theme = 'light',
  onToggleTheme
}: HeaderProps) {
  if (!authResponse) return null

  const org = authResponse.organization
  const user = authResponse.user
  const plan = org?.plan || 'free'
  const isPro = plan === 'pro'
  const isCancelled = Boolean(org?.cancel_at_period_end)

  return (
    <header style={{
      height: '64px',
      backgroundColor: 'var(--bg-canvas)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      flexShrink: 0
    }}>
      {/* Left: Organization & Plan Tier as Plain Text */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
        <div style={{
          fontFamily: "var(--font-serif, 'Source Serif 4', Georgia, serif)",
          fontSize: '1.125rem',
          fontWeight: 600,
          color: 'var(--ink-primary)'
        }}>
          {org?.name || 'Organization Workspace'}
        </div>
        <span style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>
          • {isPro ? (isCancelled ? 'Pro plan (cancels end of period)' : 'Pro plan') : 'Free tier (2 jobs limit)'}
        </span>
      </div>

      {/* Right: Theme Toggle, User Identity & Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Simple Theme Toggle */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            type="button"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.35rem 0.65rem',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--ink-primary)',
              fontSize: '0.8125rem',
              fontFamily: "var(--font-sans, 'Inter', sans-serif)",
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {theme === 'light' ? (
              <>
                <Moon style={{ width: '15px', height: '15px', color: 'var(--ink-muted)' }} />
                <span>Dark</span>
              </>
            ) : (
              <>
                <Sun style={{ width: '15px', height: '15px', color: 'var(--ink-muted)' }} />
                <span>Light</span>
              </>
            )}
          </button>
        )}

        {/* User Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
          <span style={{ fontWeight: 600, color: 'var(--ink-primary)' }}>{user?.full_name}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>({user?.role})</span>
        </div>

        {/* Subscription Manager or Upgrade Button */}
        {user?.role === 'admin' && (
          <Button
            variant={isPro ? 'outline' : 'primary'}
            size="sm"
            onClick={isPro ? onOpenManageModal : onOpenPricingModal}
          >
            {isPro ? 'Manage subscription' : 'Upgrade to Pro'}
          </Button>
        )}

        {/* Change Password Button */}
        {onOpenChangePasswordModal && (
          <Button variant="outline" size="sm" onClick={onOpenChangePasswordModal} title="Change Password">
            <KeyRound style={{ width: '14px', height: '14px', marginRight: '0.375rem' }} />
            Password
          </Button>
        )}

        {/* Logout Button */}
        <Button variant="outline" size="sm" onClick={onLogout}>
          Log out
        </Button>
      </div>
    </header>
  )
}
