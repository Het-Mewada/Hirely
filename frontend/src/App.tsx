import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { PipelinePage } from './pages/PipelinePage'
import { CandidatesPage } from './pages/CandidatesPage'
import { JobsPage } from './pages/JobsPage'
import { TeamPage } from './pages/TeamPage'
import { AuditPage } from './pages/AuditPage'
import { ScoreBreakdownModal } from './components/ScoreBreakdownModal'
import { PricingCheckoutModal } from './components/PricingCheckoutModal'
import { ManageSubscriptionModal } from './components/ManageSubscriptionModal'
import { ChangePasswordModal } from './components/ChangePasswordModal'
import { ToastContainer, ToastMessage, ToastType } from './components/ui/Toast'
import { ConfirmationModal } from './components/ui/ConfirmationModal'
import { api } from './lib/api'

export function App() {
  const navigate = useNavigate()

  // Modals State
  const [selectedScoreApp, setSelectedScoreApp] = useState<any>(null)
  const [scoreModalOpen, setScoreModalOpen] = useState(false)
  const [pricingModalOpen, setPricingModalOpen] = useState(false)
  const [manageModalOpen, setManageModalOpen] = useState(false)
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false)

  // Toast System State
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    setToasts((prev) => [...prev, { id, message, type }])
  }

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  // Confirmation Modal State
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

  const openConfirmModal = (config: {
    title: string
    description?: string
    confirmText?: string
    isDestructive?: boolean
    onConfirm: () => void
  }) => {
    setConfirmConfig({
      isOpen: true,
      title: config.title,
      description: config.description,
      confirmText: config.confirmText,
      isDestructive: config.isDestructive,
      onConfirm: config.onConfirm
    })
  }

  const closeConfirmModal = () => {
    setConfirmConfig((prev) => ({ ...prev, isOpen: false }))
  }

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('hirely_theme') as 'light' | 'dark') || 'light'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('hirely_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  // Audit Log State
  const [auditLogsList, setAuditLogsList] = useState<any[]>([])

  // Job Form State
  const [editingJobId, setEditingJobId] = useState<string | null>(null)
  const [jobTitle, setJobTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [department, setDepartment] = useState('')
  const [location, setLocation] = useState('')
  const [jobStatus, setJobStatus] = useState<'published' | 'draft' | 'closed'>('published')
  const [requiredSkillsStr, setRequiredSkillsStr] = useState('')

  // Candidate Form State
  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null)
  const [candFirstName, setCandFirstName] = useState('')
  const [candLastName, setCandLastName] = useState('')
  const [candEmail, setCandEmail] = useState('')
  const [candPhone, setCandPhone] = useState('')
  const [selectedResumeFile, setSelectedResumeFile] = useState<File | null>(null)

  // Auth State
  const [authResponse, setAuthResponse] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('hirely_auth')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  // App Data State
  const [jobsList, setJobsList] = useState<any[]>([])
  const [candidatesList, setCandidatesList] = useState<any[]>([])
  const [applicationsList, setApplicationsList] = useState<any[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string>('')
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('hirely_auth')
    setAuthResponse(null)
    setJobsList([])
    setCandidatesList([])
    setApplicationsList([])
    setSelectedCandidateId('')
    setSelectedJobId('')
    navigate('/login')
  }

  const fetchMyOrganization = async () => {
    if (!authResponse?.access_token) return
    try {
      const res = await api.get('/organizations/me')
      if (res.data && res.data.plan) {
        setAuthResponse((prev: any) => {
          if (!prev) return null
          const updated = { ...prev, organization: res.data }
          localStorage.setItem('hirely_auth', JSON.stringify(updated))
          return updated
        })
      }
    } catch (err) {
      console.error('Failed to sync organization details', err)
    }
  }

  const fetchJobsList = async () => {
    if (!authResponse?.access_token) return
    try {
      const res = await api.get('/jobs')
      setJobsList(res.data)
      if (res.data.length > 0 && !selectedJobId) setSelectedJobId(res.data[0].id)
    } catch (err) {
      console.error('Failed to fetch jobs', err)
    }
  }

  const fetchCandidatesList = async () => {
    if (!authResponse?.access_token) return
    try {
      const res = await api.get('/candidates')
      setCandidatesList(res.data)
      if (res.data.length > 0 && !selectedCandidateId) setSelectedCandidateId(res.data[0].id)
    } catch (err) {
      console.error('Failed to fetch candidates', err)
    }
  }

  const fetchApplicationsList = async () => {
    if (!authResponse?.access_token) return
    try {
      const res = await api.get('/applications')
      setApplicationsList(res.data)
    } catch (err) {
      console.error('Failed to fetch applications', err)
    }
  }

  const fetchAuditLogsList = async () => {
    if (!authResponse?.access_token) return
    try {
      const res = await api.get('/audit-logs')
      setAuditLogsList(res.data)
    } catch (err) {
      console.error('Failed to fetch audit logs', err)
    }
  }

  // Handle URL payment verification on return from Stripe
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search)
    const sessionId = queryParams.get('session_id')
    const paymentStatus = queryParams.get('payment_status')

    if (authResponse?.access_token && paymentStatus === 'success' && sessionId) {
      api.post('/organizations/verify-checkout-session', { session_id: sessionId })
        .then(res => {
          if (res.data?.organization) {
            setAuthResponse((prev: any) => {
              const updated = { ...prev, organization: res.data.organization }
              localStorage.setItem('hirely_auth', JSON.stringify(updated))
              return updated
            })
            showToast('Subscription upgraded to Pro tier!', 'success')
          }
          window.history.replaceState({}, document.title, window.location.pathname)
        })
        .catch(err => console.error('Verification failed', err))
    }
  }, [authResponse?.access_token])

  useEffect(() => {
    if (authResponse?.access_token) {
      fetchMyOrganization()
      fetchJobsList()
      fetchCandidatesList()
      fetchApplicationsList()
      fetchAuditLogsList()
    }
  }, [authResponse?.access_token])

  // Handlers for Candidate actions
  const handleSubmitCandidate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!authResponse?.access_token) return
    setLoading(true)
    try {
      if (editingCandidateId) {
        await api.patch(`/candidates/${editingCandidateId}`, {
          first_name: candFirstName,
          last_name: candLastName,
          email: candEmail,
          phone: candPhone
        })
        if (selectedResumeFile) {
          const formData = new FormData()
          formData.append('file', selectedResumeFile)
          await api.post(`/candidates/${editingCandidateId}/resume`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        }
        setEditingCandidateId(null)
        showToast('Candidate profile updated', 'success')
      } else {
        const res = await api.post('/candidates', {
          first_name: candFirstName,
          last_name: candLastName,
          email: candEmail,
          phone: candPhone
        })
        if (selectedResumeFile && res.data.id) {
          const formData = new FormData()
          formData.append('file', selectedResumeFile)
          await api.post(`/candidates/${res.data.id}/resume`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        }
        showToast('Candidate profile created', 'success')
      }
      setEditingCandidateId(null)
      setCandFirstName('')
      setCandLastName('')
      setCandEmail('')
      setCandPhone('')
      setSelectedResumeFile(null)
      fetchCandidatesList()
    } catch (err: any) {
      showToast(err.response?.data?.detail || err.message || 'Operation failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEditCandidateClick = (cand: any) => {
    setEditingCandidateId(cand.id)
    setCandFirstName(cand.first_name || '')
    setCandLastName(cand.last_name || '')
    setCandEmail(cand.email || '')
    setCandPhone(cand.phone || '')
    setSelectedResumeFile(null)
  }

  const handleCancelCandidateEdit = () => {
    setEditingCandidateId(null)
    setCandFirstName('')
    setCandLastName('')
    setCandEmail('')
    setCandPhone('')
    setSelectedResumeFile(null)
  }

  const handleDeleteCandidate = (candId: string) => {
    openConfirmModal({
      title: 'Delete candidate profile?',
      description: 'This action cannot be undone. Their application history will also be removed.',
      confirmText: 'Delete candidate',
      isDestructive: true,
      onConfirm: async () => {
        closeConfirmModal()
        setLoading(true)
        try {
          await api.delete(`/candidates/${candId}`)
          fetchCandidatesList()
          fetchApplicationsList()
          showToast('Candidate profile deleted', 'success')
        } catch (err: any) {
          showToast(err.response?.data?.detail || 'Failed to delete candidate', 'error')
        } finally {
          setLoading(false)
        }
      }
    })
  }

  // Handlers for Job actions
  const handleSubmitJob = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!authResponse?.access_token) return
    setLoading(true)
    try {
      const skillsArray = requiredSkillsStr.split(',').map(s => s.trim()).filter(Boolean)
      if (editingJobId) {
        await api.patch(`/jobs/${editingJobId}`, {
          title: jobTitle,
          description: jobDescription,
          department,
          location,
          status: jobStatus,
          required_skills: skillsArray
        })
        setEditingJobId(null)
        showToast('Job posting updated', 'success')
      } else {
        await api.post('/jobs', {
          title: jobTitle,
          description: jobDescription,
          department,
          location,
          status: jobStatus,
          required_skills: skillsArray
        })
        showToast('Job posting created', 'success')
      }
      setEditingJobId(null)
      setJobTitle('')
      setJobDescription('')
      setDepartment('')
      setLocation('')
      setJobStatus('published')
      setRequiredSkillsStr('')
      fetchJobsList()
      fetchAuditLogsList()
    } catch (err: any) {
      fetchAuditLogsList()
      showToast(err.response?.data?.detail || err.message || 'Failed to save job posting', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEditJobClick = (job: any) => {
    setEditingJobId(job.id)
    setJobTitle(job.title || '')
    setJobDescription(job.description || '')
    setDepartment(job.department || '')
    setLocation(job.location || '')
    setJobStatus(job.status || 'published')
    setRequiredSkillsStr(job.required_skills ? job.required_skills.join(', ') : '')
  }

  const handleCancelJobEdit = () => {
    setEditingJobId(null)
    setJobTitle('')
    setJobDescription('')
    setDepartment('')
    setLocation('')
    setJobStatus('published')
    setRequiredSkillsStr('')
  }

  const handleDeleteJob = (jobId: string) => {
    openConfirmModal({
      title: 'Delete job posting?',
      description: 'This action cannot be undone. All candidate applications associated with this job will be affected.',
      confirmText: 'Delete job',
      isDestructive: true,
      onConfirm: async () => {
        closeConfirmModal()
        setLoading(true)
        try {
          await api.delete(`/jobs/${jobId}`)
          fetchJobsList()
          fetchApplicationsList()
          showToast('Job posting deleted', 'success')
        } catch (err: any) {
          showToast(err.response?.data?.detail || 'Failed to delete job', 'error')
        } finally {
          setLoading(false)
        }
      }
    })
  }

  // Handlers for Pipeline actions
  const handleLinkCandidate = async () => {
    if (!selectedJobId || !selectedCandidateId) return
    setLoading(true)
    try {
      await api.post('/applications', {
        job_posting_id: selectedJobId,
        candidate_id: selectedCandidateId,
        notes: 'Submitted via Portal'
      })
      fetchApplicationsList()
      showToast('Candidate linked to job pipeline', 'success')
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to link candidate', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStage = async (appId: string, newStage: string) => {
    try {
      await api.patch(`/applications/${appId}/stage`, {
        stage: newStage,
        notes: `Moved to ${newStage}`
      })
      fetchApplicationsList()
      showToast(`Application moved to ${newStage}`, 'success')
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to update stage', 'error')
    }
  }

  const handleScoreApplication = async (appId: string) => {
    try {
      const res = await api.post(`/applications/${appId}/score`)
      fetchApplicationsList()
      setSelectedScoreApp(res.data)
      setScoreModalOpen(true)
      showToast('ATS score calculated successfully', 'success')
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to score application', 'error')
    }
  }

  const isPro = (authResponse?.organization?.plan || 'free') === 'pro'

  return (
    <>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<LoginPage onLoginSuccess={setAuthResponse} />} />
        <Route path="/signup" element={<SignupPage onSignupSuccess={setAuthResponse} />} />

        {/* Protected App Shell Routes */}
        <Route element={<ProtectedRoute />}>
          <Route
            element={
              <AppLayout
                authResponse={authResponse}
                onLogout={handleLogout}
                onOpenPricingModal={() => setPricingModalOpen(true)}
                onOpenManageModal={() => setManageModalOpen(true)}
                onOpenChangePasswordModal={() => setChangePasswordModalOpen(true)}
                theme={theme}
                onToggleTheme={toggleTheme}
              />
            }
          >
            <Route index element={<Navigate to="/pipeline" replace />} />
            <Route
              path="/pipeline"
              element={
                <PipelinePage
                  applications={applicationsList}
                  jobs={jobsList}
                  candidates={candidatesList}
                  selectedJobId={selectedJobId}
                  setSelectedJobId={setSelectedJobId}
                  selectedCandidateId={selectedCandidateId}
                  setSelectedCandidateId={setSelectedCandidateId}
                  onLinkCandidate={handleLinkCandidate}
                  onUpdateStage={handleUpdateStage}
                  onScoreApplication={handleScoreApplication}
                  loading={loading}
                  isPro={isPro}
                  onOpenPricingModal={() => setPricingModalOpen(true)}
                />
              }
            />
            <Route
              path="/candidates"
              element={
                <CandidatesPage
                  candidates={candidatesList}
                  editingCandidateId={editingCandidateId}
                  candFirstName={candFirstName}
                  setCandFirstName={setCandFirstName}
                  candLastName={candLastName}
                  setCandLastName={setCandLastName}
                  candEmail={candEmail}
                  setCandEmail={setCandEmail}
                  candPhone={candPhone}
                  setCandPhone={setCandPhone}
                  selectedResumeFile={selectedResumeFile}
                  setSelectedResumeFile={setSelectedResumeFile}
                  onSubmitCandidate={handleSubmitCandidate}
                  onEditClick={handleEditCandidateClick}
                  onCancelEdit={handleCancelCandidateEdit}
                  onDeleteClick={handleDeleteCandidate}
                  loading={loading}
                  token={authResponse?.access_token}
                />
              }
            />
            <Route
              path="/jobs"
              element={
                <JobsPage
                  jobs={jobsList}
                  editingJobId={editingJobId}
                  jobTitle={jobTitle}
                  setJobTitle={setJobTitle}
                  jobDescription={jobDescription}
                  setJobDescription={setJobDescription}
                  department={department}
                  setDepartment={setDepartment}
                  location={location}
                  setLocation={setLocation}
                  jobStatus={jobStatus}
                  setJobStatus={setJobStatus}
                  requiredSkillsStr={requiredSkillsStr}
                  setRequiredSkillsStr={setRequiredSkillsStr}
                  onSubmitJob={handleSubmitJob}
                  onEditClick={handleEditJobClick}
                  onCancelEdit={handleCancelJobEdit}
                  onDeleteClick={handleDeleteJob}
                  loading={loading}
                  isPro={isPro}
                  onOpenPricingModal={() => setPricingModalOpen(true)}
                />
              }
            />
            <Route
              path="/team"
              element={
                <TeamPage
                  currentRole={authResponse?.user?.role || 'admin'}
                  showToast={showToast}
                  fetchAuditLogs={fetchAuditLogsList}
                />
              }
            />
            <Route
              path="/audit"
              element={
                <AuditPage
                  auditLogs={auditLogsList}
                  fetchAuditLogs={fetchAuditLogsList}
                  loading={loading}
                />
              }
            />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/pipeline" replace />} />
      </Routes>

      {/* Global Modals */}
      <ScoreBreakdownModal
        isOpen={scoreModalOpen}
        onClose={() => setScoreModalOpen(false)}
        application={selectedScoreApp}
      />

      <PricingCheckoutModal
        isOpen={pricingModalOpen}
        onClose={() => setPricingModalOpen(false)}
        token={authResponse?.access_token}
        onSuccess={(updatedOrg) => {
          const updatedAuth = { ...authResponse, organization: updatedOrg }
          localStorage.setItem('hirely_auth', JSON.stringify(updatedAuth))
          setAuthResponse(updatedAuth)
          fetchAuditLogsList()
        }}
      />

      <ManageSubscriptionModal
        isOpen={manageModalOpen}
        onClose={() => setManageModalOpen(false)}
        token={authResponse?.access_token}
        organization={authResponse?.organization}
        onSubscriptionUpdated={(updatedOrg) => {
          setAuthResponse((prev: any) => {
            const updated = { ...prev, organization: updatedOrg }
            localStorage.setItem('hirely_auth', JSON.stringify(updated))
            return updated
          })
          fetchAuditLogsList()
        }}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={changePasswordModalOpen}
        onClose={() => setChangePasswordModalOpen(false)}
        showToast={showToast}
      />

      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Global Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        description={confirmConfig.description}
        confirmText={confirmConfig.confirmText}
        isDestructive={confirmConfig.isDestructive}
        onConfirm={() => {
          if (confirmConfig.onConfirm) confirmConfig.onConfirm()
        }}
        onClose={closeConfirmModal}
      />
    </>
  )
}

export default App
