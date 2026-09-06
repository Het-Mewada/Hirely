import React, { useState, useEffect } from 'react'

export function App() {
  const [apiStatus, setApiStatus] = useState<string>('Checking...')
  
  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<'signup' | 'login' | 'jobs' | 'candidates' | 'pipeline'>('candidates')
  
  // Auth Form State
  const [companyName, setCompanyName] = useState('Acme Corp')
  const [adminName, setAdminName] = useState('Alice Admin')
  const [email, setEmail] = useState('alice@acme.com')
  const [password, setPassword] = useState('Secret123!')
  
  // Job Form State
  const [jobTitle, setJobTitle] = useState('Senior Python Engineer')
  const [jobDescription, setJobDescription] = useState('Build FastAPI backend.')
  const [department, setDepartment] = useState('Engineering')
  const [location, setLocation] = useState('Remote')
  const [requiredSkillsStr, setRequiredSkillsStr] = useState('Python, FastAPI, PostgreSQL')

  // Candidate Form State
  const [candFirstName, setCandFirstName] = useState('John')
  const [candLastName, setCandLastName] = useState('Doe')
  const [candEmail, setCandEmail] = useState('john.doe@gmail.com')
  const [candPhone, setCandPhone] = useState('+1 555-0199')
  const [selectedResumeFile, setSelectedResumeFile] = useState<File | null>(null)

  // Data State
  const [authResponse, setAuthResponse] = useState<any>(null)
  const [authError, setAuthError] = useState<string>('')
  const [jobsList, setJobsList] = useState<any[]>([])
  const [candidatesList, setCandidatesList] = useState<any[]>([])
  const [applicationsList, setApplicationsList] = useState<any[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string>('')
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('')
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
    try {
      const res = await fetch('http://localhost:8000/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: companyName, admin_email: email, admin_password: password, admin_full_name: adminName })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Signup failed')
      setAuthResponse(data)
      setActiveTab('pipeline')
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
    try {
      const res = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Login failed')
      setAuthResponse(data)
      setActiveTab('pipeline')
    } catch (err: any) {
      setAuthError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!authResponse?.access_token) return
    setLoading(true)
    setAuthError('')
    try {
      const res = await fetch('http://localhost:8000/api/v1/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authResponse.access_token}` },
        body: JSON.stringify({ first_name: candFirstName, last_name: candLastName, email: candEmail, phone: candPhone })
      })
      const candidateData = await res.json()
      if (!res.ok) throw new Error(candidateData.detail || 'Failed to create candidate profile')

      // If a resume file was selected, upload it
      if (selectedResumeFile) {
        const formData = new FormData()
        formData.append('file', selectedResumeFile)
        const uploadRes = await fetch(`http://localhost:8000/api/v1/candidates/${candidateData.id}/resume`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authResponse.access_token}` },
          body: formData
        })
        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) throw new Error(uploadData.detail || 'Resume upload failed')
        setDemoResponse({ endpoint: `POST /candidates/${candidateData.id}/resume`, status: uploadRes.status, data: uploadData })
      } else {
        setDemoResponse({ endpoint: 'POST /candidates', status: res.status, data: candidateData })
      }

      fetchCandidatesList()
    } catch (err: any) {
      setAuthError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUploadResumeExisting = async (candId: string, file: File) => {
    if (!authResponse?.access_token) return
    setLoading(true)
    setAuthError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`http://localhost:8000/api/v1/candidates/${candId}/resume`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authResponse.access_token}` },
        body: formData
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Resume upload failed')
      setDemoResponse({ endpoint: `POST /candidates/${candId}/resume`, status: res.status, data })
      fetchCandidatesList()
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
    try {
      const skillsArray = requiredSkillsStr.split(',').map(s => s.trim()).filter(Boolean)
      const res = await fetch('http://localhost:8000/api/v1/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authResponse.access_token}` },
        body: JSON.stringify({ title: jobTitle, description: jobDescription, department, location, status: 'published', required_skills: skillsArray })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to create job')
      setDemoResponse({ endpoint: 'POST /jobs', status: res.status, data })
      fetchJobsList()
    } catch (err: any) {
      setAuthError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateApplication = async () => {
    if (!authResponse?.access_token || !selectedJobId || !selectedCandidateId) return
    setLoading(true)
    setAuthError('')
    try {
      const res = await fetch('http://localhost:8000/api/v1/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authResponse.access_token}` },
        body: JSON.stringify({ job_posting_id: selectedJobId, candidate_id: selectedCandidateId, notes: 'Submitted via Portal' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to link candidate to job')
      setDemoResponse({ endpoint: 'POST /applications', status: res.status, data })
      fetchApplicationsList()
    } catch (err: any) {
      setAuthError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStage = async (appId: string, newStage: string) => {
    if (!authResponse?.access_token) return
    setLoading(true)
    try {
      const res = await fetch(`http://localhost:8000/api/v1/applications/${appId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authResponse.access_token}` },
        body: JSON.stringify({ stage: newStage, notes: `Moved to ${newStage}` })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to update stage')
      setDemoResponse({ endpoint: `PATCH /applications/${appId}/stage`, status: res.status, data })
      fetchApplicationsList()
    } catch (err: any) {
      setAuthError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchJobsList = async () => {
    if (!authResponse?.access_token) return
    const res = await fetch('http://localhost:8000/api/v1/jobs', { headers: { 'Authorization': `Bearer ${authResponse.access_token}` } })
    const data = await res.json()
    if (res.ok) {
      setJobsList(data)
      if (data.length > 0 && !selectedJobId) setSelectedJobId(data[0].id)
    }
  }

  const fetchCandidatesList = async () => {
    if (!authResponse?.access_token) return
    const res = await fetch('http://localhost:8000/api/v1/candidates', { headers: { 'Authorization': `Bearer ${authResponse.access_token}` } })
    const data = await res.json()
    if (res.ok) {
      setCandidatesList(data)
      if (data.length > 0 && !selectedCandidateId) setSelectedCandidateId(data[0].id)
    }
  }

  const fetchApplicationsList = async () => {
    if (!authResponse?.access_token) return
    const res = await fetch('http://localhost:8000/api/v1/applications', { headers: { 'Authorization': `Bearer ${authResponse.access_token}` } })
    const data = await res.json()
    if (res.ok) setApplicationsList(data)
  }

  useEffect(() => {
    if (authResponse?.access_token) {
      fetchJobsList()
      fetchCandidatesList()
      fetchApplicationsList()
    }
  }, [authResponse])

  const pipelineStages = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected']

  return (
    <div className="container" style={{ textAlign: 'center', paddingTop: '2.5rem', paddingBottom: '4rem' }}>
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
        marginBottom: '1.25rem',
        color: '#a5b4fc',
        boxShadow: '0 0 15px rgba(99, 102, 241, 0.15)'
      }}>
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: apiStatus === 'healthy' || apiStatus === 'Connected' ? '#10b981' : '#ef4444'
        }} />
        <span>✨ Phase 8 — spaCy NER Skill Extraction Complete ({apiStatus})</span>
      </div>

      <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.025em' }}>
        Welcome to <span className="gradient-text">Hirely</span>
      </h1>
      
      <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '750px', margin: '0 auto 2rem', lineHeight: '1.5' }}>
        spaCy NLP Entity Extraction, Skills Taxonomy & Experience Estimation.
      </p>

      {/* Navigation Bar */}
      <div style={{
        display: 'inline-flex',
        gap: '0.5rem',
        backgroundColor: 'var(--bg-card)',
        padding: '0.35rem',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        marginBottom: '2rem'
      }}>
        {(['candidates', 'pipeline', 'jobs', 'signup', 'login'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              backgroundColor: activeTab === tab ? 'var(--primary-accent)' : 'transparent',
              color: activeTab === tab ? 'white' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {tab === 'candidates' ? '📄 Candidates & Resumes' : tab === 'pipeline' ? '⚡ Pipeline Kanban' : tab === 'jobs' ? '💼 Jobs' : tab === 'signup' ? '🏢 Tenant Signup' : '🔑 Login'}
          </button>
        ))}
      </div>

      {!authResponse && (
        <div style={{ maxWidth: '600px', margin: '0 auto 2rem', padding: '1rem', borderRadius: '0.75rem', backgroundColor: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.3)', color: '#facc15', fontSize: '0.9rem' }}>
          ⚠️ Please sign up a company or log in to upload candidate resumes and manage files.
        </div>
      )}

      {/* Auth Notification Bar */}
      {authResponse && (
        <div style={{ maxWidth: '950px', margin: '0 auto 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-card)', padding: '0.75rem 1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 600 }}>
            🏢 {authResponse.organization.name} | 👤 {authResponse.user.full_name} ({authResponse.user.role.toUpperCase()})
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Storage Path: <code>uploads/{authResponse.organization.id.substring(0, 8)}.../resumes/</code>
          </div>
        </div>
      )}

      {/* Main Tab Panels */}
      {activeTab === 'candidates' && (
        <div style={{ maxWidth: '1050px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', textAlign: 'left' }}>
          {/* Left Column: Create Candidate & Resume Upload Form */}
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>Create Candidate & Upload Resume</h3>
            <form onSubmit={handleCreateCandidate} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>First Name</label>
                  <input type="text" value={candFirstName} onChange={(e) => setCandFirstName(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white' }} required />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Last Name</label>
                  <input type="text" value={candLastName} onChange={(e) => setCandLastName(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white' }} required />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Email</label>
                <input type="email" value={candEmail} onChange={(e) => setCandEmail(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white' }} required />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Phone</label>
                <input type="text" value={candPhone} onChange={(e) => setCandPhone(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Resume File (PDF, DOCX, TXT - Max 10MB)</label>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => setSelectedResumeFile(e.target.files?.[0] || null)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px dashed var(--primary-accent)', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '0.8rem' }}
                />
              </div>
              <button type="submit" disabled={loading || !authResponse} style={{ marginTop: '0.5rem', padding: '0.75rem', borderRadius: '0.375rem', border: 'none', background: 'var(--primary-gradient)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                {loading ? 'Uploading...' : 'Save Profile & Upload Resume'}
              </button>
            </form>
          </div>

          {/* Right Column: Existing Candidate Roster & Upload Status */}
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Candidate Profiles ({candidatesList.length})</h3>
              {authResponse && <button onClick={fetchCandidatesList} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', border: 'none', backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer' }}>Refresh</button>}
            </div>

            {candidatesList.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No candidate profiles created yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', maxHeight: '420px', overflowY: 'auto' }}>
                {candidatesList.map(cand => (
                  <div key={cand.id} style={{ padding: '0.875rem', borderRadius: '0.5rem', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{cand.first_name} {cand.last_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0.5rem' }}>
                      {cand.email} {cand.phone ? `• ${cand.phone}` : ''}
                      {cand.estimated_experience_years !== null && cand.estimated_experience_years !== undefined && cand.estimated_experience_years > 0 && (
                        <span style={{ marginLeft: '0.5rem', padding: '0.15rem 0.4rem', borderRadius: '0.25rem', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd', fontSize: '0.75rem', fontWeight: 600 }}>
                          ⏳ {cand.estimated_experience_years} Yrs Exp
                        </span>
                      )}
                    </div>

                    {/* Extracted Skills Badges */}
                    {cand.parsed_skills && cand.parsed_skills.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', margin: '0.35rem 0 0.5rem' }}>
                        {cand.parsed_skills.map((skill: string, idx: number) => (
                          <span key={idx} style={{ padding: '0.15rem 0.45rem', borderRadius: '0.25rem', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#6ee7b7', fontSize: '0.7rem', fontWeight: 500 }}>
                            🔷 {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Extracted Education */}
                    {cand.parsed_education && cand.parsed_education.length > 0 && (
                      <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.4rem', textAlign: 'left' }}>
                        🎓 <strong>Education:</strong> {cand.parsed_education.join(' • ')}
                      </div>
                    )}
                    
                    {cand.resume_url ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.35rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>📄 Resume Uploaded</span>
                          <a
                            href={`http://localhost:8000${cand.resume_url}${authResponse?.access_token ? `?token=${authResponse.access_token}` : ''}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: '0.75rem', color: '#60a5fa', textDecoration: 'underline' }}
                          >
                            Download File
                          </a>
                        </div>

                        {cand.resume_text && (
                          <div style={{ marginTop: '0.25rem' }}>
                            {cand.resume_text.includes('[NEEDS_MANUAL_REVIEW]') ? (
                              <div style={{ padding: '0.4rem 0.6rem', borderRadius: '0.25rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', fontSize: '0.75rem', textAlign: 'left' }}>
                                ⚠️ <strong>Needs Manual Review:</strong> Scanned or image-only PDF.
                              </div>
                            ) : (
                              <details style={{ textAlign: 'left' }}>
                                <summary style={{ cursor: 'pointer', fontSize: '0.75rem', color: '#a7f3d0', fontWeight: 500 }}>
                                  📝 Extracted Text ({cand.resume_text.length} chars)
                                </summary>
                                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-secondary)', backgroundColor: 'rgba(0,0,0,0.4)', padding: '0.5rem', borderRadius: '0.375rem', marginTop: '0.25rem', maxHeight: '120px', overflowY: 'auto' }}>
                                  {cand.resume_text}
                                </pre>
                              </details>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
                        <input
                          type="file"
                          accept=".pdf,.docx,.txt"
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleUploadResumeExisting(cand.id, e.target.files[0])
                          }}
                          style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'pipeline' && (
        <div style={{ maxWidth: '1150px', margin: '0 auto' }}>
          {/* Quick Apply Action Panel */}
          {authResponse && (
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '0.875rem', padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'left', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>➕ Link Candidate to Job:</span>
              <select
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '0.375rem', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid var(--border-color)' }}
              >
                <option value="" style={{ backgroundColor: '#1e293b', color: '#f8fafc' }}>-- Select Candidate --</option>
                {candidatesList.map(c => <option key={c.id} value={c.id} style={{ backgroundColor: '#1e293b', color: '#f8fafc' }}>{c.first_name} {c.last_name} ({c.email})</option>)}
              </select>

              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '0.375rem', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid var(--border-color)' }}
              >
                <option value="" style={{ backgroundColor: '#1e293b', color: '#f8fafc' }}>-- Select Job Posting --</option>
                {jobsList.map(j => <option key={j.id} value={j.id} style={{ backgroundColor: '#1e293b', color: '#f8fafc' }}>{j.title}</option>)}
              </select>

              <button
                onClick={handleCreateApplication}
                disabled={loading || !selectedJobId || !selectedCandidateId}
                style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', background: 'var(--primary-gradient)', color: 'white', fontWeight: 700, cursor: 'pointer', opacity: (!selectedJobId || !selectedCandidateId) ? 0.5 : 1 }}
              >
                Submit Application (APPLIED)
              </button>
            </div>
          )}

          {/* Kanban Board Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.875rem', textAlign: 'left' }}>
            {pipelineStages.map(stage => {
              const stageApps = applicationsList.filter(a => a.stage === stage)
              const stageColors: Record<string, string> = {
                applied: '#60a5fa',
                screening: '#a855f7',
                interview: '#facc15',
                offer: '#fb923c',
                hired: '#34d399',
                rejected: '#f87171'
              }
              return (
                <div key={stage} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '0.875rem', minHeight: '320px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: stageColors[stage] }}>{stage}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: 'rgba(0,0,0,0.3)', padding: '0.1rem 0.4rem', borderRadius: '9999px' }}>{stageApps.length}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {stageApps.map(app => (
                      <div key={app.id} style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.5rem', padding: '0.65rem' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {app.candidate ? `${app.candidate.first_name} ${app.candidate.last_name}` : 'Candidate'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0.5rem' }}>
                          {app.job_posting ? app.job_posting.title : 'Job Posting'}
                        </div>
                        
                        <select
                          value={app.stage}
                          onChange={(e) => handleUpdateStage(app.id, e.target.value)}
                          style={{ width: '100%', fontSize: '0.7rem', padding: '0.2rem', borderRadius: '0.25rem', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid var(--border-color)' }}
                        >
                          {pipelineStages.map(s => (
                            <option key={s} value={s} style={{ backgroundColor: '#1e293b', color: '#f8fafc' }}>
                              Move to {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 'jobs' && (
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'left', backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>Create Job Posting</h3>
          <form onSubmit={handleCreateJob} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Job Title</label>
              <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white' }} required />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Description</label>
              <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={2} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', fontFamily: 'inherit' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Department</label>
                <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Location</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Required Skills (comma separated)</label>
              <input type="text" value={requiredSkillsStr} onChange={(e) => setRequiredSkillsStr(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white' }} />
            </div>
            <button type="submit" disabled={loading || !authResponse} style={{ marginTop: '0.5rem', padding: '0.65rem', borderRadius: '0.375rem', border: 'none', background: 'var(--primary-gradient)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
              POST /api/v1/jobs
            </button>
          </form>
        </div>
      )}

      {(activeTab === 'signup' || activeTab === 'login') && (
        <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'left', backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
          {activeTab === 'signup' ? (
            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem', fontWeight: 600 }}>Create New Organization</h3>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Company Name</label>
                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white' }} required />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Admin Full Name</label>
                <input type="text" value={adminName} onChange={(e) => setAdminName(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white' }} required />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white' }} required />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white' }} required />
              </div>
              <button type="submit" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.65rem', borderRadius: '0.375rem', border: 'none', background: 'var(--primary-gradient)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                {loading ? 'Processing...' : 'Create Organization & Admin'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem', fontWeight: 600 }}>Login</h3>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white' }} required />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white' }} required />
              </div>
              <button type="submit" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.65rem', borderRadius: '0.375rem', border: 'none', background: 'var(--primary-gradient)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                {loading ? 'Processing...' : 'Login'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Error & Response Inspector */}
      {authError && (
        <div style={{ maxWidth: '600px', margin: '1.5rem auto 0', padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.85rem', textAlign: 'left' }}>
          ⚠️ {authError}
        </div>
      )}

      {demoResponse && (
        <div style={{ maxWidth: '950px', margin: '1.5rem auto 0', padding: '1rem', borderRadius: '0.75rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', textAlign: 'left' }}>
          <span style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
            API Response [{demoResponse.endpoint}] - Status {demoResponse.status}:
          </span>
          <pre style={{ backgroundColor: 'rgba(0,0,0,0.5)', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', color: '#34d399', overflowX: 'auto', maxHeight: '180px' }}>
            {JSON.stringify(demoResponse.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

export default App
