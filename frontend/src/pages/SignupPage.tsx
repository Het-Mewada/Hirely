import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'

interface SignupPageProps {
  onSignupSuccess: (data: any) => void
}

export function SignupPage({ onSignupSuccess }: SignupPageProps) {
  const [companyName, setCompanyName] = useState('')
  const [adminName, setAdminName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

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
      if (!res.ok) throw new Error(data.detail || 'Signup failed.')

      localStorage.setItem('hirely_auth', JSON.stringify(data))
      onSignupSuccess(data)
      navigate('/pipeline')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-canvas)', padding: '1.5rem' }}>
      <Card style={{ maxWidth: '440px', width: '100%' }}>
        <CardHeader style={{ textAlign: 'center', padding: '2rem 1.5rem 1rem' }}>
          <div style={{
            fontFamily: "var(--font-serif, 'Source Serif 4', Georgia, serif)",
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--ink-primary)',
            marginBottom: '0.25rem'
          }}>
            Hirely
          </div>
          <CardTitle style={{ fontSize: '1.125rem', fontWeight: 600 }}>Create enterprise workspace</CardTitle>
          <CardDescription>Register your organization to set up isolated tenant tracking.</CardDescription>
        </CardHeader>

        <CardContent style={{ padding: '1.5rem' }}>
          <form onSubmit={handleSignup} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)', display: 'block', marginBottom: '0.25rem' }}>Company / organization name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Corp"
                autoComplete="off"
                style={{ width: '100%', backgroundColor: 'var(--bg-canvas)' }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)', display: 'block', marginBottom: '0.25rem' }}>Admin full name</label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="e.g. Alice Admin"
                autoComplete="off"
                style={{ width: '100%', backgroundColor: 'var(--bg-canvas)' }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)', display: 'block', marginBottom: '0.25rem' }}>Admin email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@company.com"
                autoComplete="off"
                style={{ width: '100%', backgroundColor: 'var(--bg-canvas)' }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)', display: 'block', marginBottom: '0.25rem' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                style={{ width: '100%', backgroundColor: 'var(--bg-canvas)' }}
                required
              />
            </div>

            {error && (
              <div style={{ padding: '0.625rem', borderRadius: '4px', backgroundColor: 'var(--status-rejected-bg)', border: '1px solid var(--status-rejected-border)', color: 'var(--status-rejected)', fontSize: '0.8125rem' }}>
                {error}
              </div>
            )}

            <Button variant="primary" size="md" type="submit" isLoading={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
              Create organization workspace
            </Button>

            <div style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--ink-muted)', marginTop: '0.5rem' }}>
              Already registered?{' '}
              <Link to="/login" style={{ color: 'var(--ink-primary)', fontWeight: 600, textDecoration: 'underline' }}>
                Sign in to existing account
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
