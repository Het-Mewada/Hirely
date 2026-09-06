import { useState } from 'react'

interface ManageSubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  token?: string
  organization: any
  onSubscriptionUpdated: (updatedOrg: any) => void
}

export function ManageSubscriptionModal({
  isOpen,
  onClose,
  token,
  organization,
  onSubscriptionUpdated
}: ManageSubscriptionModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  if (!isOpen || !organization) return null

  const isCancelled = Boolean(organization.cancel_at_period_end)
  const expiresAt = organization.plan_expires_at
    ? new Date(organization.plan_expires_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'End of Billing Period'

  const handleCancelSubscription = async () => {
    if (!token) return
    if (!window.confirm('Are you sure you want to cancel your subscription auto-renewal? You will keep full Pro access until your current billing period ends.')) return

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const res = await fetch('http://localhost:8000/api/v1/organizations/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to cancel subscription.')

      onSubscriptionUpdated(data)
      setMessage(`Subscription auto-renewal cancelled. You retain full Pro access until ${expiresAt}.`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResumeSubscription = async () => {
    if (!token) return
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const res = await fetch('http://localhost:8000/api/v1/organizations/resume-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to resume subscription.')

      onSubscriptionUpdated(data)
      setMessage('Auto-renewal resumed successfully!')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1.5rem'
    }}>
      <div style={{
        backgroundColor: '#0f172a',
        border: '1px solid var(--border-color)',
        borderRadius: '1rem',
        maxWidth: '560px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        color: '#f8fafc',
        padding: '2rem',
        textAlign: 'left'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
              💳 Manage <span className="gradient-text">Pro Subscription</span>
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
              View subscription details and payment settings for {organization.name}.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '1.4rem',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Subscription Info Card */}
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.35)',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          fontSize: '0.9rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Current Tier:</span>
            <span style={{ fontWeight: 800, color: '#6ee7b7', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.8rem', border: '1px solid #10b981' }}>
              ⭐ PRO PLAN
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Billing Cycle:</span>
            <span style={{ fontWeight: 600, color: '#f8fafc', textTransform: 'capitalize' }}>
              {organization.billing_cycle === 'annual' ? 'Annual (1 Year - $468/yr)' : 'Monthly ($49/mo)'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Auto-Renewal Status:</span>
            <span style={{
              fontWeight: 700,
              fontSize: '0.8rem',
              color: isCancelled ? '#fcd34d' : '#34d399'
            }}>
              {isCancelled ? '⚠️ Cancelled (Expires at End of Cycle)' : '✅ Active (Auto-Renews)'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              {isCancelled ? 'Access Valid Through:' : 'Next Renewal Date:'}
            </span>
            <span style={{ fontWeight: 700, color: '#a5b4fc' }}>
              {expiresAt}
            </span>
          </div>

          {organization.last_payment_txn && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', marginTop: '0.25rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Last Transaction ID:</span>
              <code style={{
                fontSize: '0.75rem',
                color: '#93c5fd',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                padding: '0.4rem 0.6rem',
                borderRadius: '0.375rem',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                wordBreak: 'break-all',
                overflowWrap: 'anywhere',
                whiteSpace: 'pre-wrap'
              }}>
                {organization.last_payment_txn}
              </code>
            </div>
          )}
        </div>

        {/* Status Alerts */}
        {message && (
          <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#6ee7b7', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            ✅ {message}
          </div>
        )}

        {error && (
          <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Action Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {!isCancelled ? (
            <button
              onClick={handleCancelSubscription}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid #ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#fca5a5',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {loading ? 'Processing Cancellation...' : '🚫 Cancel Future Auto-Renewal'}
            </button>
          ) : (
            <button
              onClick={handleResumeSubscription}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid #10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#6ee7b7',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {loading ? 'Resuming...' : '🔄 Resume Auto-Renewal'}
            </button>
          )}

          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, textAlign: 'center', lineHeight: '1.4' }}>
            Note: Cancelling future billing stops future recurring charges while granting full Pro tier features until <strong>{expiresAt}</strong>.
          </p>
        </div>
      </div>
    </div>
  )
}
