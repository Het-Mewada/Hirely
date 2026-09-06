import { useState } from 'react'
import { ModalShell } from './ui/ModalShell'
import { Button } from './ui/button'
import { api } from '../lib/api'
import { KeyRound, AlertCircle } from 'lucide-react'

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
}

export function ChangePasswordModal({ isOpen, onClose, showToast }: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleClose = () => {
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setErrorMsg('')
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!oldPassword) {
      setErrorMsg('Please enter your current or temporary password')
      return
    }
    if (newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters long')
      return
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword
      })
      showToast('Password changed successfully', 'success')
      handleClose()
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || 'Failed to change password'
      setErrorMsg(detail)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalShell isOpen={isOpen} onClose={handleClose} maxWidth="440px">
      <div style={{ padding: '1.5rem' }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-muted, #f3f4f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--ink-primary)'
          }}>
            <KeyRound style={{ width: '18px', height: '18px' }} />
          </div>
          <div>
            <h3 style={{
              fontFamily: "var(--font-serif, 'Source Serif 4', Georgia, serif)",
              fontSize: '1.25rem',
              fontWeight: 600,
              color: 'var(--ink-primary)',
              margin: 0
            }}>
              Change Password
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', margin: '0.125rem 0 0 0' }}>
              Update your password or replace your temporary login credentials.
            </p>
          </div>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 0.875rem',
            borderRadius: '4px',
            backgroundColor: 'var(--status-rejected-bg, #fef2f2)',
            border: '1px solid var(--status-rejected-border, #fecaca)',
            color: 'var(--status-rejected-text, #991b1b)',
            fontSize: '0.8125rem',
            marginBottom: '1.25rem'
          }}>
            <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          {/* Current / Temp Password */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--ink-primary)',
              marginBottom: '0.375rem'
            }}>
              Current / Temporary Password
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Enter current password"
              autoComplete="off"
              required
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-canvas)',
                color: 'var(--ink-primary)',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
          </div>

          {/* New Password */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--ink-primary)',
              marginBottom: '0.375rem'
            }}>
              New Password (min 8 chars)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              autoComplete="off"
              required
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-canvas)',
                color: 'var(--ink-primary)',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Confirm New Password */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--ink-primary)',
              marginBottom: '0.375rem'
            }}>
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              autoComplete="off"
              required
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-canvas)',
                color: 'var(--ink-primary)',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </form>
      </div>
    </ModalShell>
  )
}
