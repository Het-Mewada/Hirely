import React, { useState, useEffect } from 'react'

export function App() {
  const [apiStatus, setApiStatus] = useState<string>('Checking...')
  
  // Auth Form State
  const [activeTab, setActiveTab] = useState<'signup' | 'login'>('signup')
  const [companyName, setCompanyName] = useState('Acme Corp')
  const [adminName, setAdminName] = useState('Alice Admin')
  const [email, setEmail] = useState('alice@acme.com')
  const [password, setPassword] = useState('Secret123!')
  
  // Auth Result State
  const [authResponse, setAuthResponse] = useState<any>(null)
  const [authError, setAuthError] = useState<string>('')
  const [meResponse, setMeResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/health')
      .then(res => res.json())
      .then(data => setApiStatus(data.status || 'Connected'))
      .catch(() => setApiStatus('Backend offline or initializing'))
  }, [])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setAuthError('')
    setAuthResponse(null)
    setMeResponse(null)

    try {
      const res = await fetch('http://localhost:8000/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          admin_email: email,
          admin_password: password,
          admin_full_name: adminName
        })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || 'Signup failed')
      }
      setAuthResponse(data)
    } catch (err: any) {
      setAuthError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setAuthError('')
    setAuthResponse(null)
    setMeResponse(null)

    try {
      const res = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          password: password
        })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || 'Login failed')
      }
      setAuthResponse(data)
    } catch (err: any) {
      setAuthError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFetchMe = async () => {
    if (!authResponse?.access_token) return
    setLoading(true)
    try {
      const res = await fetch('http://localhost:8000/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${authResponse.access_token}`
        }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Fetch /me failed')
      setMeResponse(data)
    } catch (err: any) {
      setAuthError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ textAlign: 'center', paddingTop: '3rem', paddingBottom: '4rem' }}>
      {/* Badge */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1.25rem',
        borderRadius: '9999px',
        backgroundColor: 'rgba(99, 102, 241, 0.12)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        fontSize: '0.875rem',
        fontWeight: 600,
        marginBottom: '1.5rem',
        color: '#a5b4fc',
        boxShadow: '0 0 15px rgba(99, 102, 241, 0.15)'
      }}>
        <span>✨ Phase 2 — Auth & Tenant Onboarding Complete</span>
      </div>

      <h1 style={{ fontSize: '3.25rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.025em' }}>
        Welcome to <span className="gradient-text">Hirely</span>
      </h1>
      
      <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto 2.5rem', lineHeight: '1.6' }}>
        Multi-Tenant Organization Signup & JWT Authentication Workspace.
      </p>

      {/* Main Split Layout: System Status + Interactive Auth Sandbox */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '1.5rem',
        maxWidth: '1000px',
        margin: '0 auto',
        textAlign: 'left'
      }}>
        
        {/* Left Column: System Status & Auth Overview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 15px 25px -5px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>System Status</h3>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(0,0,0,0.25)',
              borderRadius: '0.5rem',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: apiStatus === 'healthy' || apiStatus === 'Connected' ? '#10b981' : '#ef4444'
                }} />
                <span>FastAPI Service</span>
              </div>
              <span style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: apiStatus === 'healthy' || apiStatus === 'Connected' ? '#34d399' : '#f87171'
              }}>
                {apiStatus}
              </span>
            </div>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '1rem',
            padding: '1.5rem'
          }}>
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Tenant Auth Endpoints
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '0.15rem 0.4rem', borderRadius: '0.25rem', fontWeight: 700, fontSize: '0.75rem' }}>POST</span>
                <code>/api/v1/auth/signup</code>
              </li>
              <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '0.15rem 0.4rem', borderRadius: '0.25rem', fontWeight: 700, fontSize: '0.75rem' }}>POST</span>
                <code>/api/v1/auth/login</code>
              </li>
              <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '0.15rem 0.4rem', borderRadius: '0.25rem', fontWeight: 700, fontSize: '0.75rem' }}>GET</span>
                <code>/api/v1/auth/me</code>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Interactive Auth Sandbox */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '1rem',
          padding: '1.5rem',
          boxShadow: '0 15px 25px -5px rgba(0, 0, 0, 0.3)'
        }}>
          {/* Tab Switcher */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <button
              onClick={() => setActiveTab('signup')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: activeTab === 'signup' ? 'var(--primary-accent)' : 'transparent',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Company Signup
            </button>
            <button
              onClick={() => setActiveTab('login')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: activeTab === 'login' ? 'var(--primary-accent)' : 'transparent',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              User Login
            </button>
          </div>

          <form onSubmit={activeTab === 'signup' ? handleSignup : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activeTab === 'signup' && (
              <>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Organization / Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Admin Full Name</label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white' }}
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white' }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white' }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '0.5rem',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: 'var(--primary-gradient)',
                color: 'white',
                fontWeight: 700,
                cursor: 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Processing...' : activeTab === 'signup' ? 'Create Organization & Admin' : 'Login'}
            </button>
          </form>

          {/* Auth Error Display */}
          {authError && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.85rem' }}>
              ⚠️ {authError}
            </div>
          )}

          {/* Auth Success Token & Payload Display */}
          {authResponse && (
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 600 }}>✅ Auth Success (JWT Issued)</span>
                <button
                  onClick={handleFetchMe}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', border: 'none', backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer' }}
                >
                  Test GET /auth/me
                </button>
              </div>

              <pre style={{
                backgroundColor: 'rgba(0,0,0,0.5)',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                color: '#a5b4fc',
                overflowX: 'auto',
                maxHeight: '160px'
              }}>
                {JSON.stringify(authResponse, null, 2)}
              </pre>
            </div>
          )}

          {/* GET /auth/me Output Display */}
          {meResponse && (
            <div style={{ marginTop: '1rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#60a5fa', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>👤 Token Decoded (/auth/me):</span>
              <pre style={{
                backgroundColor: 'rgba(0,0,0,0.5)',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                color: '#34d399',
                overflowX: 'auto'
              }}>
                {JSON.stringify(meResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
