import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface AppLayoutProps {
  authResponse: any
  onLogout: () => void
  onOpenPricingModal: () => void
  onOpenManageModal: () => void
  onOpenChangePasswordModal?: () => void
  theme?: 'light' | 'dark'
  onToggleTheme?: () => void
}

export function AppLayout({
  authResponse,
  onLogout,
  onOpenPricingModal,
  onOpenManageModal,
  onOpenChangePasswordModal,
  theme,
  onToggleTheme
}: AppLayoutProps) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-canvas)', color: 'var(--ink-primary)' }}>
      {/* Left Sidebar Navigation */}
      <Sidebar />

      {/* Main Right Content Shell */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        {/* Top Header */}
        <Header
          authResponse={authResponse}
          onLogout={onLogout}
          onOpenPricingModal={onOpenPricingModal}
          onOpenManageModal={onOpenManageModal}
          onOpenChangePasswordModal={onOpenChangePasswordModal}
          theme={theme}
          onToggleTheme={onToggleTheme}
        />

        {/* Main Scrollable View Area */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: '2rem 2.5rem',
          maxWidth: '1500px',
          width: '100%',
          margin: '0 auto'
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
