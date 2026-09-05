import React, { useState, useEffect } from 'react'

export function App() {
  const [apiStatus, setApiStatus] = useState<string>('Checking...')
  
  // Auth Form State
  const [activeTab, setActiveTab] = useState<'signup' | 'login' | 'jobs'>('signup')
  const [companyName, setCompanyName] = useState('Acme Corp')
  const [adminName, setAdminName] = useState('Alice Admin')
  const [email, setEmail] = useState('alice@acme.com')
  const [password, setPassword] = useState('Secret123!')
  
  // Job Form State
  const [jobTitle, setJobTitle] = useState('Senior Python Engineer')
  const [jobDescription, setJobDescription] = useState('Design and build FastAPI multi-tenant SaaS application.')
  const [department, setDepartment] = useState('Engineering')
  const [location, setLocation] = useState('Remote')
  const [requiredSkillsStr, setRequiredSkillsStr] = useState('Python, FastAPI, PostgreSQL, Redis, Docker')

  // Data State
  const [authResponse, setAuthResponse] = useState<any>(null)
  const [authError, setAuthError] = useState<string>('')
  const [jobsList, setJobsList] = useState<any[]>([])
  const [demoResponse, setDemoResponse] = useState<any>(null)
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
    setDemoResponse(null)

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
      if (!res.ok) throw new Error(data.detail || 'Signup failed')
      setAuthResponse(data)
      setActiveTab('jobs')
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
    setDemoResponse(null)

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
      if (!res.ok) throw new Error(data.detail || 'Login failed')
      setAuthResponse(data)
      setActiveTab('jobs')
    } catch (err: any) {
      setAuthError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!authResponse?.access_token) return
    setLoading(true)
    setAuthError('')

    const skillsArray = requiredSkillsStr
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    try {
      const res = await fetch('http://localhost:8000/api/v1/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authResponse.access_token}`
        },
        body: JSON.stringify({
          title: jobTitle,
          description: jobDescription,
          department: department,
          location: location,
          status: 'published',
          required_skills: skillsArray
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to create job posting')
      
      setDemoResponse({ endpoint: 'POST /api/v1/jobs', status: res.status, data })
      fetchJobsList()
    } catch (err: any) {
      setAuthError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchJobsList = async () => {
    if (!authResponse?.access_token) return
    try {
      const res = await fetch('http://localhost:8000/api/v1/jobs', {
        headers: { 'Authorization': `Bearer ${authResponse.access_token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setJobsList(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (authResponse?.access_token) {
      fetchJobsList()
    }
  }, [authResponse])

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
        <span>✨ Phase 4 — Job Posting CRUD Complete</span>
      </div>

      <h1 style={{ fontSize: '3.25rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.025em' }}>
        Welcome to <span className="gradient-text">Hirely</span>
      </h1>
      
      <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto 2.5rem', lineHeight: '1.6' }}>
        Job Requisition Management with Required Skills Tagging & Role-Gated Access.
      </p>

      {/* Main Split Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '1.5rem',
        maxWidth: '1050px',
        margin: '0 auto',
        textAlign: 'left'
      }}>
        
        {/* Left Column: System Overview & Active Tenant Jobs */}
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

          {/* Active Job Requisitions List */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '1rem',
            padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                💼 Organization Job Postings ({jobsList.length})
              </h3>
              {authResponse && (
                <button
                  onClick={fetchJobsList}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', border: 'none', backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer' }}
                >
                  Refresh
                </button>
              )}
            </div>

            {!authResponse ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Please sign up or log in on the right panel to view and manage your organization's job postings.
              </p>
            ) : jobsList.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                No job postings created yet for <strong>{authResponse.organization.name}</strong>. Create one using the form on the right!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {jobsList.map(job => (
                  <div key={job.id} style={{
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{job.title}</h4>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.4rem',
                        borderRadius: '0.25rem',
                        backgroundColor: job.status === 'published' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                        color: job.status === 'published' ? '#34d399' : '#facc15'
                      }}>
                        {job.status.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {job.department || 'Engineering'} • {job.location || 'Remote'}
                    </p>
                    {job.required_skills && job.required_skills.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {job.required_skills.map((skill: string, sIdx: number) => (
                          <span key={sIdx} style={{
                            fontSize: '0.7rem',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '0.25rem',
                            backgroundColor: 'rgba(99, 102, 241, 0.15)',
                            color: '#818cf8',
                            border: '1px solid rgba(99, 102, 241, 0.2)'
                          }}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Auth & Job Creation Panel */}
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
                padding: '0.5rem 0.75rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: activeTab === 'signup' ? 'var(--primary-accent)' : 'transparent',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Signup Tenant
            </button>
            <button
              onClick={() => setActiveTab('login')}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: activeTab === 'login' ? 'var(--primary-accent)' : 'transparent',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Login
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: activeTab === 'jobs' ? 'var(--primary-accent)' : 'transparent',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Create Job
            </button>
          </div>

          {activeTab === 'signup' && (
            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Company Name</label>
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
                style={{ marginTop: '0.5rem', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', background: 'var(--primary-gradient)', color: 'white', fontWeight: 700, cursor: 'pointer' }}
              >
                {loading ? 'Processing...' : 'Create Organization & Admin'}
              </button>
            </form>
          )}

          {activeTab === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
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
                style={{ marginTop: '0.5rem', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', background: 'var(--primary-gradient)', color: 'white', fontWeight: 700, cursor: 'pointer' }}
              >
                {loading ? 'Processing...' : 'Login'}
              </button>
            </form>
          )}

          {activeTab === 'jobs' && (
            <form onSubmit={handleCreateJob} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {!authResponse && (
                <div style={{ padding: '0.5rem', borderRadius: '0.25rem', backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#facc15', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                  ⚠️ Please log in first to authenticate as Admin/Recruiter.
                </div>
              )}
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Job Title</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white' }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Description</label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={2}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', fontFamily: 'inherit' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Required Skills (comma separated)</label>
                <input
                  type="text"
                  value={requiredSkillsStr}
                  onChange={(e) => setRequiredSkillsStr(e.target.value)}
                  placeholder="Python, FastAPI, PostgreSQL"
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white' }}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !authResponse}
                style={{ marginTop: '0.5rem', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', background: 'var(--primary-gradient)', color: 'white', fontWeight: 700, cursor: 'pointer', opacity: (!authResponse || loading) ? 0.6 : 1 }}
              >
                {loading ? 'Publishing...' : 'POST /api/v1/jobs'}
              </button>
            </form>
          )}

          {/* Auth Error Display */}
          {authError && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.85rem' }}>
              ⚠️ {authError}
            </div>
          )}

          {/* API Response Inspector */}
          {demoResponse && (
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                Response [{demoResponse.endpoint}] - Status {demoResponse.status}:
              </span>
              <pre style={{
                backgroundColor: 'rgba(0,0,0,0.5)',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                color: demoResponse.status === 201 || demoResponse.status === 200 ? '#34d399' : '#f87171',
                overflowX: 'auto',
                maxHeight: '180px'
              }}>
                {JSON.stringify(demoResponse.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
