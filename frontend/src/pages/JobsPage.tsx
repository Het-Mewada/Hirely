import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'

interface JobsPageProps {
  jobs: any[]
  editingJobId: string | null
  jobTitle: string
  setJobTitle: (val: string) => void
  jobDescription: string
  setJobDescription: (val: string) => void
  department: string
  setDepartment: (val: string) => void
  location: string
  setLocation: (val: string) => void
  jobStatus: 'published' | 'draft' | 'closed'
  setJobStatus: (val: 'published' | 'draft' | 'closed') => void
  requiredSkillsStr: string
  setRequiredSkillsStr: (val: string) => void
  onSubmitJob: (e: React.FormEvent) => void
  onEditClick: (job: any) => void
  onCancelEdit: () => void
  onDeleteClick: (jobId: string) => void
  loading: boolean
  isPro?: boolean
  onOpenPricingModal?: () => void
}

export function JobsPage({
  jobs,
  editingJobId,
  jobTitle,
  setJobTitle,
  jobDescription,
  setJobDescription,
  department,
  setDepartment,
  location,
  setLocation,
  jobStatus,
  setJobStatus,
  requiredSkillsStr,
  setRequiredSkillsStr,
  onSubmitJob,
  onEditClick,
  onCancelEdit,
  onDeleteClick,
  loading,
  isPro = false,
  onOpenPricingModal
}: JobsPageProps) {
  const activeJobCount = jobs.filter((j) => j.status === 'published').length
  const isOverLimit = !isPro && activeJobCount > 2

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontFamily: "var(--font-serif, 'Source Serif 4', Georgia, serif)", fontSize: '1.75rem', fontWeight: 600, color: 'var(--ink-primary)', margin: 0 }}>
          Job postings
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginTop: '0.25rem' }}>
          Define open positions, required skill profiles, and ATS scoring thresholds.
        </p>
      </div>

      {/* Persistent Soft Lock Warning Banner */}
      {isOverLimit && (
        <div style={{
          backgroundColor: 'var(--status-rejected-bg)',
          border: '1px solid var(--status-rejected-border)',
          borderRadius: '6px',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          color: 'var(--ink-primary)'
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--status-rejected)' }}>
              Plan limit exceeded ({activeJobCount} active postings / 2 allowed)
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>
              Your plan allows 2 active postings — you currently have {activeJobCount}. Existing postings remain fully active, but creating or reactivating postings is soft-locked until resolved.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const table = document.querySelector('.roster-table')
                if (table) {
                  table.scrollIntoView({ behavior: 'smooth' })
                }
              }}
            >
              Archive postings
            </Button>

            {onOpenPricingModal && (
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenPricingModal}
              >
                Upgrade plan
              </Button>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '1.75rem', alignItems: 'start' }}>
        {/* Form Panel: Create / Edit Job */}
        <Card>
          <CardHeader style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <CardTitle>
              {editingJobId ? 'Edit job posting' : 'Create job posting'}
            </CardTitle>
            {editingJobId && (
              <Button variant="ghost" size="sm" onClick={onCancelEdit}>
                Cancel
              </Button>
            )}
          </CardHeader>

          <CardContent>
            <form onSubmit={onSubmitJob} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)', display: 'block', marginBottom: '0.25rem' }}>Job title</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Python Engineer"
                  autoComplete="off"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)', display: 'block', marginBottom: '0.25rem' }}>Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Engineering"
                    autoComplete="off"
                    style={{ width: '100%' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)', display: 'block', marginBottom: '0.25rem' }}>Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Remote"
                    autoComplete="off"
                    style={{ width: '100%' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)', display: 'block', marginBottom: '0.25rem' }}>Posting status</label>
                <select
                  value={jobStatus}
                  onChange={(e) => setJobStatus(e.target.value as any)}
                  style={{ width: '100%' }}
                >
                  <option value="published">Published (Active)</option>
                  <option value="draft">Draft</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)', display: 'block', marginBottom: '0.25rem' }}>Required skills (comma separated)</label>
                <input
                  type="text"
                  value={requiredSkillsStr}
                  onChange={(e) => setRequiredSkillsStr(e.target.value)}
                  placeholder="e.g. Python, FastAPI, PostgreSQL"
                  autoComplete="off"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)', display: 'block', marginBottom: '0.25rem' }}>Job description</label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Enter job responsibilities, qualifications, and requirements..."
                  rows={4}
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <Button variant="primary" size="md" type="submit" isLoading={loading} style={{ marginTop: '0.5rem' }}>
                {editingJobId ? 'Save job changes' : 'Create & publish job'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Structured Job Postings Roster Table */}
        <Card>
          <CardHeader>
            <CardTitle>Job directory ({jobs.length})</CardTitle>
          </CardHeader>
          <CardContent style={{ padding: 0 }}>
            {jobs.length === 0 ? (
              <div style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', textAlign: 'center', padding: '3rem 1rem' }}>
                No active job postings created yet.
              </div>
            ) : (
              <table className="roster-table">
                <thead>
                  <tr>
                    <th>Job title</th>
                    <th>Department</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Required skills</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => {
                    const isEditing = editingJobId === job.id

                    return (
                      <tr key={job.id} style={{ backgroundColor: isEditing ? 'var(--bg-surface)' : undefined }}>
                        {/* Job Title in Source Serif 4 */}
                        <td>
                          <div style={{ fontFamily: "var(--font-serif, 'Source Serif 4', Georgia, serif)", fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink-primary)' }}>
                            {job.title}
                          </div>
                        </td>

                        <td>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--ink-primary)' }}>{job.department}</span>
                        </td>

                        <td>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--ink-primary)' }}>{job.location}</span>
                        </td>

                        {/* Status Badge */}
                        <td>
                          <Badge
                            variant={job.status === 'published' ? 'matched' : job.status === 'draft' ? 'pending' : 'rejected'}
                          >
                            {job.status === 'published' ? 'Active' : job.status === 'draft' ? 'Draft' : 'Closed'}
                          </Badge>
                        </td>

                        {/* Required Skills Tags */}
                        <td>
                          {job.required_skills && job.required_skills.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                              {job.required_skills.slice(0, 4).map((skill: string, idx: number) => (
                                <Badge key={idx} variant="outline" style={{ fontSize: '0.7rem' }}>
                                  {skill}
                                </Badge>
                              ))}
                              {job.required_skills.length > 4 && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', alignSelf: 'center' }}>
                                  +{job.required_skills.length - 4}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>None specified</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.375rem' }}>
                            <Button variant="outline" size="sm" onClick={() => onEditClick(job)}>
                              Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => onDeleteClick(job.id)}>
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
