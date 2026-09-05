import React, { useState, useEffect } from 'react'

export function App() {
  const [apiStatus, setApiStatus] = useState<string>('Checking...')

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/health')
      .then(res => res.json())
      .then(data => setApiStatus(data.status || 'Connected'))
      .catch(() => setApiStatus('Backend offline or initializing'))
  }, [])

  const schemaEntities = [
    { name: 'Organizations', description: 'Tenant management & unique slug routing', icon: '🏢' },
    { name: 'Users', description: 'Multi-role authentication (Admin, Recruiter, Hiring Manager)', icon: '👥' },
    { name: 'Job Postings', description: 'Requisition lifecycle (Draft, Published, Closed, Archived)', icon: '💼' },
    { name: 'Candidates', description: 'Profiles & resume attachments per organization', icon: '📄' },
    { name: 'Applications', description: 'Candidate ↔ Job pipeline stages, score & notes', icon: '⚡' },
    { name: 'Audit Logs', description: 'Tenant activity & security event auditing', icon: '🛡️' },
  ]

  return (
    <div className="container" style={{ textAlign: 'center', paddingTop: '3rem', paddingBottom: '3rem' }}>
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
        <span>✨ Phase 1 — Database Schema Complete</span>
      </div>

      <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.025em' }}>
        Welcome to <span className="gradient-text">Hirely</span>
      </h1>
      
      <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto 2.5rem', lineHeight: '1.6' }}>
        Next-Generation AI Applicant Tracking System & Multi-Tenant Resume Screening Platform.
      </p>

      {/* System Status Card */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '1rem',
        padding: '1.75rem',
        maxWidth: '550px',
        margin: '0 auto 3rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
      }}>
        <h3 style={{ marginBottom: '1.25rem', fontSize: '1.125rem', color: 'var(--text-primary)', textAlign: 'left', fontWeight: 600 }}>
          System & Service Status
        </h3>
        <div style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          padding: '0.875rem 1.25rem',
          backgroundColor: 'rgba(0,0,0,0.25)',
          borderRadius: '0.75rem',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: apiStatus === 'healthy' || apiStatus === 'Connected' ? '#10b981' : '#ef4444',
              boxShadow: apiStatus === 'healthy' || apiStatus === 'Connected' ? '0 0 10px #10b981' : 'none'
            }} />
            <span style={{ fontWeight: 500 }}>Backend API Service</span>
          </div>
          <span style={{
            fontWeight: 600,
            fontSize: '0.875rem',
            padding: '0.25rem 0.75rem',
            borderRadius: '0.375rem',
            backgroundColor: apiStatus === 'healthy' || apiStatus === 'Connected' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: apiStatus === 'healthy' || apiStatus === 'Connected' ? '#34d399' : '#f87171'
          }}>
            {apiStatus}
          </span>
        </div>
      </div>

      {/* Phase 1 Multi-Tenant Data Models Overview */}
      <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Multi-Tenant Data Architecture
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Enforced tenant isolation powered by mandatory <code style={{ color: '#818cf8', backgroundColor: 'rgba(99, 102, 241, 0.1)', padding: '0.1rem 0.4rem', borderRadius: '0.25rem' }}>organization_id</code> foreign keys.
            </p>
          </div>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '0.35rem 0.75rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            color: '#34d399',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            Alembic 001_initial_schema
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem'
        }}>
          {schemaEntities.map((entity, idx) => (
            <div key={idx} style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '0.875rem',
              padding: '1.25rem',
              transition: 'transform 0.2s ease, border-color 0.2s ease'
            }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{entity.icon}</div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                {entity.name}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                {entity.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
