import React, { useState, useEffect } from 'react'

export function App() {
  const [apiStatus, setApiStatus] = useState<string>('Checking...')

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/health')
      .then(res => res.json())
      .then(data => setApiStatus(data.status || 'Connected'))
      .catch(() => setApiStatus('Backend offline or initializing'))
  }, [])

  return (
    <div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
      <div style={{
        display: 'inline-block',
        padding: '0.5rem 1rem',
        borderRadius: '9999px',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        fontSize: '0.875rem',
        marginBottom: '1.5rem',
        color: '#818cf8'
      }}>
        ✨ Phase 0 Scaffold Ready
      </div>

      <h1 style={{ fontSize: '3.5rem', fontWeight: 700, marginBottom: '1rem', tracking: '-0.025em' }}>
        Welcome to <span className="gradient-text">Hirely</span>
      </h1>
      
      <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
        Next-Generation AI Applicant Tracking System & Resume Screening Platform.
      </p>

      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '1rem',
        padding: '2rem',
        maxWidth: '500px',
        margin: '0 auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
      }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>System Status</h3>
        <div style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          padding: '0.75rem 1rem',
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: '0.5rem'
        }}>
          <span>Backend API</span>
          <span style={{
            fontWeight: 600,
            color: apiStatus === 'healthy' || apiStatus === 'Connected' ? '#34d399' : '#f87171'
          }}>
            {apiStatus}
          </span>
        </div>
      </div>
    </div>
  )
}

export default App
