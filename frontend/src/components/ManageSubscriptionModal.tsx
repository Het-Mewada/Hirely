import { useState } from 'react'
import { ConfirmationModal } from './ui/ConfirmationModal'

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

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean
    title: string
    description?: string
    confirmText?: string
    isDestructive?: boolean
    onConfirm?: () => void
  }>({
    isOpen: false,
    title: ''
  })

  if (!isOpen || !organization) return null

  const isCancelled = Boolean(organization.cancel_at_period_end)
  const expiresAt = organization.plan_expires_at
    ? new Date(organization.plan_expires_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'End of billing period'

  const executeCancelSubscription = async () => {
    setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    if (!token) return

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

  const promptCancelSubscription = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Cancel subscription auto-renewal?',
      description: `You will keep full Pro access until your current billing period ends on ${expiresAt}.`,
      confirmText: 'Confirm cancellation',
      isDestructive: false,
      onConfirm: executeCancelSubscription
    })
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

  const executeDowngradeToFree = async () => {
    setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    if (!token) return

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const res = await fetch('http://localhost:8000/api/v1/organizations/me/plan', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan: 'free' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to downgrade plan.')

      onSubscriptionUpdated(data)
      setMessage('Plan downgraded to Free tier. Soft lock policy is now active.')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const promptDowngradeToFree = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Downgrade to Free plan?',
      description: 'Your existing postings will remain intact under soft lock, but creating or reactivating postings will be restricted if over 2 active jobs.',
      confirmText: 'Downgrade plan',
      isDestructive: true,
      onConfirm: executeDowngradeToFree
    })
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1.5rem'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        maxWidth: '520px',
        width: '100%',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25)',
        color: 'var(--ink-primary)',
        padding: '1.75rem',
        textAlign: 'left'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-serif, 'Source Serif 4', Georgia, serif)", fontSize: '1.35rem', fontWeight: 600, margin: 0, color: 'var(--ink-primary)' }}>
              Manage Pro subscription
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', margin: '0.25rem 0 0' }}>
              Subscription status and payment details for {organization.name}.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--ink-muted)',
              fontSize: '1.25rem',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Subscription Info Panel */}
        <div style={{
          backgroundColor: 'var(--bg-canvas)',
          borderRadius: '4px',
          padding: '1rem',
          border: '1px solid var(--border-color)',
          marginBottom: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.625rem',
          fontSize: '0.875rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--ink-muted)' }}>Current tier:</span>
            <span style={{ fontWeight: 600, color: organization.plan === 'pro' ? 'var(--status-matched)' : 'var(--ink-muted)' }}>
              {organization.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--ink-muted)' }}>Billing cycle:</span>
            <span style={{ color: 'var(--ink-primary)', textTransform: 'capitalize' }}>
              {organization.billing_cycle === 'annual' ? 'Annual ($468/yr)' : 'Monthly ($49/mo)'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--ink-muted)' }}>Auto-renewal:</span>
            <span style={{ fontWeight: 600, color: isCancelled ? 'var(--status-pending)' : 'var(--status-matched)' }}>
              {isCancelled ? 'Cancelled (Ends at period end)' : 'Active (Auto-renews)'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--ink-muted)' }}>
              {isCancelled ? 'Access valid through:' : 'Next renewal date:'}
            </span>
            <span style={{ fontWeight: 600, color: 'var(--ink-primary)' }}>
              {expiresAt}
            </span>
          </div>

          {organization.last_payment_txn && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              <span style={{ color: 'var(--ink-muted)' }}>Transaction ID:</span>
              <code style={{ fontSize: '0.75rem', color: 'var(--ink-primary)', wordBreak: 'break-all' }}>
                {organization.last_payment_txn}
              </code>
            </div>
          )}
        </div>

        {/* Status Messages */}
        {message && (
          <div style={{ padding: '0.625rem', borderRadius: '4px', backgroundColor: 'var(--status-matched-bg)', border: '1px solid var(--status-matched-border)', color: 'var(--status-matched)', fontSize: '0.8125rem', marginBottom: '1rem' }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{ padding: '0.625rem', borderRadius: '4px', backgroundColor: 'var(--status-rejected-bg)', border: '1px solid var(--status-rejected-border)', color: 'var(--status-rejected)', fontSize: '0.8125rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {/* Action Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {!isCancelled ? (
            <button
              onClick={promptCancelSubscription}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.625rem',
                borderRadius: '4px',
                border: '1px solid var(--status-rejected-border)',
                backgroundColor: 'var(--status-rejected-bg)',
                color: 'var(--status-rejected)',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer'
              }}
            >
              {loading ? 'Processing cancellation...' : 'Cancel future auto-renewal'}
            </button>
          ) : (
            <button
              onClick={handleResumeSubscription}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.625rem',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: 'var(--accent-navy)',
                color: 'var(--accent-navy-text)',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer'
              }}
            >
              {loading ? 'Resuming...' : 'Resume auto-renewal'}
            </button>
          )}

          {organization.plan === 'pro' && (
            <button
              onClick={promptDowngradeToFree}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'transparent',
                color: 'var(--ink-muted)',
                fontWeight: 500,
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              Downgrade to Free plan immediately (Testing)
            </button>
          )}

          <p style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', margin: 0, textAlign: 'center', lineHeight: '1.4' }}>
            Note: Cancelling auto-renewal stops future charges while maintaining full Pro access until <strong>{expiresAt}</strong>.
          </p>
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        description={confirmConfig.description}
        confirmText={confirmConfig.confirmText}
        isDestructive={confirmConfig.isDestructive}
        loading={loading}
        onConfirm={() => {
          if (confirmConfig.onConfirm) confirmConfig.onConfirm()
        }}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
