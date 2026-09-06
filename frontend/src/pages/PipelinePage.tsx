import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'

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
  onUpdateStage,
  onScoreApplication,
  loading,
  isPro,
  onOpenPricingModal
}: PipelinePageProps) {
  const pipelineStages = [
    { key: 'applied', label: 'Applied' },
    { key: 'screening', label: 'Screening' },
    { key: 'interview', label: 'Interview' },
    { key: 'offer', label: 'Offer' },
    { key: 'hired', label: 'Hired' },
    { key: 'rejected', label: 'Rejected' }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-serif, 'Source Serif 4', Georgia, serif)", fontSize: '1.75rem', fontWeight: 600, color: 'var(--ink-primary)', margin: 0 }}>
            Pipeline & ATS scoring
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginTop: '0.25rem' }}>
            Roster evaluation, application stage progression, and skill match scoring.
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
        <CardHeader>
          <CardTitle style={{ fontSize: '1rem' }}>Submit application profile to job</CardTitle>
        </CardHeader>
        <CardContent>
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

      {/* Roster Pipeline Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', alignItems: 'start' }}>
        {pipelineStages.map((stageObj) => {
          const stageApps = applications.filter((a) => a.stage === stageObj.key)

          return (
            <Card key={stageObj.key} style={{ minHeight: '440px', backgroundColor: 'var(--bg-canvas)' }}>
              <CardHeader style={{ padding: '0.875rem 1rem', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink-primary)' }}>
                  {stageObj.label}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', fontWeight: 600 }}>
                  {stageApps.length}
                </span>
              </CardHeader>

              <CardContent style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {stageApps.length === 0 ? (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', textAlign: 'center', padding: '2.5rem 0' }}>
                    No applicants
                  </div>
                ) : (
                  stageApps.map((app) => {
                    const cand = candidates.find((c) => c.id === app.candidate_id) || app.candidate
                    const job = jobs.find((j) => j.id === app.job_posting_id) || app.job_posting

                    return (
                      <div
                        key={app.id}
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          borderRadius: '4px',
                          padding: '0.875rem',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.625rem'
                        }}
                      >
                        <div>
                          {/* Candidate Name in Source Serif 4 */}
                          <div style={{ fontFamily: "var(--font-serif, 'Source Serif 4', Georgia, serif)", fontWeight: 600, fontSize: '0.9375rem', color: 'var(--ink-primary)' }}>
                            {cand ? `${cand.first_name} ${cand.last_name}` : 'Candidate profile'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '0.15rem' }}>
                            {job ? job.title : 'Job posting'}
                          </div>
                        </div>

                        {/* ATS Match Score */}
                        {app.ats_score !== null && app.ats_score !== undefined ? (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.375rem 0.5rem',
                            borderRadius: '3px',
                            backgroundColor: 'var(--bg-canvas)',
                            border: '1px solid var(--border-color)'
                          }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>Match score</span>
                            <Badge variant={app.ats_score >= 75 ? 'matched' : app.ats_score >= 50 ? 'pending' : 'rejected'}>
                              {app.ats_score}%
                            </Badge>
                          </div>
                        ) : (
                          <div>
                            {isPro ? (
                              <Button variant="outline" size="sm" onClick={() => onScoreApplication(app.id)} style={{ width: '100%', fontSize: '0.75rem' }}>
                                Calculate ATS score
                              </Button>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--status-pending)' }}>Score gated (Pro)</span>
                            )}
                          </div>
                        )}

                        {/* Move Stage Selector */}
                        <div style={{ marginTop: '0.15rem' }}>
                          <label style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', display: 'block', marginBottom: '0.15rem' }}>Move stage:</label>
                          <select
                            value={app.stage}
                            onChange={(e) => onUpdateStage(app.id, e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.35rem 0.5rem',
                              fontSize: '0.75rem',
                              backgroundColor: 'var(--bg-canvas)'
                            }}
                          >
                            {pipelineStages.map((s) => (
                              <option key={s.key} value={s.key}>{s.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
