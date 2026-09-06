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
        maxWidth: '680px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        color: '#f8fafc',
        padding: '2rem',
        textAlign: 'left'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
              🚀 Upgrade to <span className="gradient-text">Hirely Pro</span>
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
              Select a plan & complete secure payment for full 1-year unlimited access.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '1.5rem',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {receipt ? (
          /* Payment Success Receipt View */
          <div style={{ padding: '1.5rem', borderRadius: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎉</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#34d399', margin: '0 0 0.5rem' }}>
              Payment Successful & Plan Upgraded!
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '1.25rem' }}>
              Your organization has been upgraded to <strong>Hirely Pro</strong>.
            </p>

            <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', borderRadius: '0.5rem', padding: '1rem', textAlign: 'left', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', color: '#e2e8f0' }}>
              <div>💳 <strong>Transaction ID:</strong> <code style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}>{receipt.transaction_id}</code></div>
              <div>💵 <strong>Amount Paid:</strong> {receipt.amount_paid}</div>
              <div>📅 <strong>Billing Plan:</strong> {receipt.billing_cycle}</div>
              <div>⏳ <strong>Pro Access Valid Until:</strong> <strong style={{ color: '#6ee7b7' }}>{new Date(receipt.expires_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} (1 Year)</strong></div>
              <div>👤 <strong>Cardholder:</strong> {receipt.cardholder} (**** {receipt.card_last_four})</div>
            </div>

            <button
              onClick={onClose}
              style={{
                marginTop: '1.5rem',
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: 'var(--primary-gradient)',
                color: 'white',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Continue to Pro Workspace
            </button>
          </div>
        ) : (
          /* Pricing Selection & Payment Form */
          <div>
            {/* Pricing Selector Options */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div
                onClick={() => setBillingCycle('annual')}
                style={{
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: billingCycle === 'annual' ? '2px solid #6366f1' : '1px solid var(--border-color)',
                  backgroundColor: billingCycle === 'annual' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(0,0,0,0.3)',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                <div style={{ position: 'absolute', top: '-10px', right: '10px', backgroundColor: '#10b981', color: 'white', fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                  SAVE 20% (1 YEAR)
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Pro Annual</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#a5b4fc', margin: '0.25rem 0' }}>
                  $39 <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>/mo</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Billed annually ($468/yr) for 1 Full Year access</div>
              </div>

              <div
                onClick={() => setBillingCycle('monthly')}
                style={{
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: billingCycle === 'monthly' ? '2px solid #6366f1' : '1px solid var(--border-color)',
                  backgroundColor: billingCycle === 'monthly' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(0,0,0,0.3)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Pro Monthly</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#a5b4fc', margin: '0.25rem 0' }}>
                  $49 <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>/mo</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Billed monthly ($49/mo), cancel anytime</div>
              </div>
            </div>

            {/* Feature Highlights */}
            <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '0.5rem', padding: '0.875rem', marginBottom: '1.5rem', fontSize: '0.8rem' }}>
              <div style={{ fontWeight: 700, marginBottom: '0.4rem', color: '#60a5fa' }}>Included in Pro Plan:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', color: '#cbd5e1' }}>
                <div>✅ Unlimited Active Job Postings</div>
                <div>✅ AI Resume ATS Match Scoring</div>
                <div>✅ Explainable 60/30/10 Breakdown</div>
                <div>✅ Tenant Audit Trail Access</div>
              </div>
            </div>

            {/* Payment Drawer */}
            <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem', marginBottom: '0.25rem' }}>
                💳 Payment Information (Stripe Secure Gateway)
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cardholder Name</label>
                <input
                  type="text"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.4)', color: 'white' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Card Number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.4)', color: 'white', fontFamily: 'monospace' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Expiration Date</label>
                  <input
                    type="text"
                    value={cardExp}
                    onChange={(e) => setCardExp(e.target.value)}
                    placeholder="MM/YY"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.4)', color: 'white' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>CVC Code</label>
                  <input
                    type="text"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    placeholder="123"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.4)', color: 'white' }}
                    required
                  />
                </div>
              </div>

              {error && (
                <div style={{ padding: '0.5rem 0.75rem', borderRadius: '0.375rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.8rem' }}>
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.85rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: 'var(--primary-gradient)',
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'
                }}
              >
                {loading ? '⚡ Processing Secure Payment...' : `🔒 Pay ${billingCycle === 'annual' ? '$468.00 USD (1 Year)' : '$49.00 USD'} & Upgrade Now`}
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                🔒 256-Bit SSL Encrypted • 30-Day Money Back Guarantee
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
