import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { KanbanBoard } from '../components/kanban/KanbanBoard'

interface PipelinePageProps {
  applications: any[]
  jobs: any[]
  candidates: any[]
  selectedJobId: string
  setSelectedJobId: (id: string) => void
  selectedCandidateId: string
  setSelectedCandidateId: (id: string) => void
  onLinkCandidate: () => void
  onUpdateStage: (appId: string, stage: string) => void
  onScoreApplication: (appId: string) => void
  loading: boolean
  isPro: boolean
  onOpenPricingModal: () => void
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
}

export function PipelinePage({
  applications,
  jobs,
  candidates,
  selectedJobId,
  setSelectedJobId,
  selectedCandidateId,
  setSelectedCandidateId,
  onLinkCandidate,
  onScoreApplication,
  loading,
  isPro,
  onOpenPricingModal,
  showToast
}: PipelinePageProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-serif, 'Source Serif 4', Georgia, serif)", fontSize: '1.75rem', fontWeight: 600, color: 'var(--ink-primary)', margin: 0 }}>
            Candidate Pipeline & ATS Scoring
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginTop: '0.25rem' }}>
            Visual drag-and-drop Kanban board for stage progression and skill match scoring.
          </p>
        </div>

        {!isPro && (
          <Button variant="outline" size="sm" onClick={onOpenPricingModal}>
            Upgrade to Pro for full ATS scoring
          </Button>
        )}
      </div>

      {/* Control Panel: Link Candidate to Job */}
      <Card>
        <CardHeader style={{ padding: '1rem 1.25rem' }}>
          <CardTitle style={{ fontSize: '1rem' }}>Submit application profile to job</CardTitle>
        </CardHeader>
        <CardContent style={{ padding: '0 1.25rem 1.25rem 1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1.25rem', alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)', display: 'block', marginBottom: '0.25rem' }}>Candidate profile</label>
              <select
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">-- Select candidate --</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>{c.first_name} {c.last_name} ({c.email})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)', display: 'block', marginBottom: '0.25rem' }}>Target job posting</label>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">-- Select job posting --</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>{j.title} ({j.department})</option>
                ))}
              </select>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={onLinkCandidate}
              disabled={loading || !selectedJobId || !selectedCandidateId}
            >
              Submit application
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Drag and Drop Kanban Board */}
      <KanbanBoard
        initialApplications={applications}
        jobs={jobs}
        candidates={candidates}
        isPro={isPro}
        onScoreApplication={onScoreApplication}
        showToast={showToast}
      />
    </div>
  )
}
