import React, { useState } from 'react'

interface PricingCheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  token?: string
  onSuccess: (updatedOrg: any, receipt: any) => void
}

export function PricingCheckoutModal({
  isOpen,
  onClose,
  token,
  onSuccess
}: PricingCheckoutModalProps) {
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual')
  const [cardholderName, setCardholderName] = useState('Alice Admin')
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242')
  const [cardExp, setCardExp] = useState('12/28')
  const [cardCvc, setCardCvc] = useState('123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState<any>(null)

  if (!isOpen) return null

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setLoading(true)
    setError('')
    setReceipt(null)

    try {
      const res = await fetch('http://localhost:8000/api/v1/organizations/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan_tier: 'pro',
          billing_cycle: billingCycle,
          card_number: cardNumber,
          card_exp: cardExp,
          card_cvc: cardCvc,
          cardholder_name: cardholderName
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Payment processing failed.')

      if (data.status === 'redirect' && data.url) {
        window.location.href = data.url
        return
      }

      setReceipt(data.receipt)
      onSuccess(data.organization, data.receipt)
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
        maxWidth: '620px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25)',
        color: 'var(--ink-primary)',
        padding: '1.75rem',
        textAlign: 'left'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-serif, 'Source Serif 4', Georgia, serif)", fontSize: '1.35rem', fontWeight: 600, margin: 0, color: 'var(--ink-primary)' }}>
              Upgrade organization to Pro
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', margin: '0.25rem 0 0' }}>
              Select billing cycle and enter payment details to enable full ATS match scoring.
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

        {receipt ? (
          /* Payment Success Receipt View */
          <div style={{ padding: '1.25rem', borderRadius: '4px', backgroundColor: 'var(--status-matched-bg)', border: '1px solid var(--status-matched-border)', textAlign: 'center' }}>
            <h3 style={{ fontFamily: "var(--font-serif, 'Source Serif 4', Georgia, serif)", fontSize: '1.125rem', fontWeight: 600, color: 'var(--status-matched)', margin: '0 0 0.5rem' }}>
              Payment completed successfully
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--ink-primary)', marginBottom: '1rem' }}>
              Your organization has been upgraded to <strong>Hirely Pro</strong>.
            </p>

            <div style={{ backgroundColor: 'var(--bg-canvas)', borderRadius: '4px', padding: '0.875rem', border: '1px solid var(--border-color)', textAlign: 'left', fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', color: 'var(--ink-primary)' }}>
              <div>Transaction ID: <code>{receipt.transaction_id}</code></div>
              <div>Amount paid: {receipt.amount_paid}</div>
              <div>Billing cycle: {receipt.billing_cycle}</div>
              <div>Pro access valid until: <strong>{new Date(receipt.expires_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>
              <div>Cardholder: {receipt.cardholder} (**** {receipt.card_last_four})</div>
            </div>

            <button
              onClick={onClose}
              style={{
                marginTop: '1.25rem',
                width: '100%',
                padding: '0.625rem',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: 'var(--accent-navy)',
                color: 'var(--accent-navy-text)',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Return to workspace
            </button>
          </div>
        ) : (
          /* Pricing Selection & Payment Form */
          <div>
            {/* Pricing Selector Options */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div
                onClick={() => setBillingCycle('annual')}
                style={{
                  padding: '0.875rem 1rem',
                  borderRadius: '4px',
                  border: billingCycle === 'annual' ? '2px solid var(--accent-navy)' : '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-canvas)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--status-matched)', marginBottom: '0.2rem' }}>
                  ANNUAL (20% DISCOUNT)
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink-primary)' }}>Pro Annual</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-navy)', margin: '0.15rem 0' }}>
                  $39 <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', fontWeight: 400 }}>/mo</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>Billed annually ($468/yr)</div>
              </div>

              <div
                onClick={() => setBillingCycle('monthly')}
                style={{
                  padding: '0.875rem 1rem',
                  borderRadius: '4px',
                  border: billingCycle === 'monthly' ? '2px solid var(--accent-navy)' : '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-canvas)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink-primary)', marginTop: '0.9rem' }}>Pro Monthly</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-navy)', margin: '0.15rem 0' }}>
                  $49 <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', fontWeight: 400 }}>/mo</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>Billed monthly, cancel anytime</div>
              </div>
            </div>

            {/* Included Features */}
            <div style={{ backgroundColor: 'var(--bg-canvas)', borderRadius: '4px', border: '1px solid var(--border-color)', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.8125rem' }}>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--ink-primary)' }}>Included in Pro Plan:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem', color: 'var(--ink-muted)' }}>
                <div>• Unlimited job postings</div>
                <div>• Full ATS match scoring</div>
                <div>• 60/30/10 score breakdown</div>
                <div>• Tenant audit trail access</div>
              </div>
            </div>

            {/* Payment Form */}
            <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem' }}>
                Payment Details
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)', display: 'block', marginBottom: '0.2rem' }}>Cardholder name</label>
                <input
                  type="text"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  style={{ width: '100%', backgroundColor: 'var(--bg-canvas)' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)', display: 'block', marginBottom: '0.2rem' }}>Card number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  style={{ width: '100%', backgroundColor: 'var(--bg-canvas)', fontFamily: 'monospace' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)', display: 'block', marginBottom: '0.2rem' }}>Expiration date</label>
                  <input
                    type="text"
                    value={cardExp}
                    onChange={(e) => setCardExp(e.target.value)}
                    placeholder="MM/YY"
                    style={{ width: '100%', backgroundColor: 'var(--bg-canvas)' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)', display: 'block', marginBottom: '0.2rem' }}>CVC code</label>
                  <input
                    type="text"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    placeholder="123"
                    style={{ width: '100%', backgroundColor: 'var(--bg-canvas)' }}
                    required
                  />
                </div>
              </div>

              {error && (
                <div style={{ padding: '0.5rem 0.75rem', borderRadius: '4px', backgroundColor: 'var(--status-rejected-bg)', border: '1px solid var(--status-rejected-border)', color: 'var(--status-rejected)', fontSize: '0.8125rem' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: 'var(--accent-navy)',
                  color: 'var(--accent-navy-text)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                {loading ? 'Processing payment...' : `Pay ${billingCycle === 'annual' ? '$468.00 USD' : '$49.00 USD'} & upgrade`}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
