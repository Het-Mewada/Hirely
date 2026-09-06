import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { FileUpload } from '../components/ui/FileUpload'

interface CandidatesPageProps {
  candidates: any[]
  editingCandidateId: string | null
  candFirstName: string
  setCandFirstName: (val: string) => void
  candLastName: string
  setCandLastName: (val: string) => void
  candEmail: string
  setCandEmail: (val: string) => void
  candPhone: string
  setCandPhone: (val: string) => void
  selectedResumeFile?: File | null
  setSelectedResumeFile: (file: File | null) => void
  onSubmitCandidate: (e: React.FormEvent) => void
  onEditClick: (cand: any) => void
  onCancelEdit: () => void
  onDeleteClick: (candId: string) => void
  loading: boolean
  token?: string
}

export function CandidatesPage({
  candidates,
  editingCandidateId,
  candFirstName,
  setCandFirstName,
  candLastName,
  setCandLastName,
  candEmail,
  setCandEmail,
  candPhone,
  setCandPhone,
  selectedResumeFile,
  setSelectedResumeFile,
  onSubmitCandidate,
  onEditClick,
  onCancelEdit,
  onDeleteClick,
  loading,
  token
}: CandidatesPageProps) {
  const editingCandidate = candidates.find((c) => c.id === editingCandidateId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Header Title */}
      <div>
        <h1 style={{ fontFamily: "var(--font-serif, 'Source Serif 4', Georgia, serif)", fontSize: '1.75rem', fontWeight: 600, color: 'var(--ink-primary)', margin: 0 }}>
          Candidate roster
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginTop: '0.25rem' }}>
          Manage applicant records, contact details, and parsed resume profiles.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '1.75rem', alignItems: 'start' }}>
        {/* Form Panel: Create / Edit Candidate */}
        <Card>
          <CardHeader style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <CardTitle>
              {editingCandidateId ? 'Edit candidate' : 'Add candidate'}
            </CardTitle>
            {editingCandidateId && (
              <Button variant="ghost" size="sm" onClick={onCancelEdit}>
                Cancel
              </Button>
            )}
          </CardHeader>

          <CardContent>
            <form onSubmit={onSubmitCandidate} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)', display: 'block', marginBottom: '0.25rem' }}>First name</label>
                  <input
                    type="text"
                    value={candFirstName}
                    onChange={(e) => setCandFirstName(e.target.value)}
                    placeholder="e.g. John"
                    autoComplete="off"
                    style={{ width: '100%' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)', display: 'block', marginBottom: '0.25rem' }}>Last name</label>
                  <input
                    type="text"
                    value={candLastName}
                    onChange={(e) => setCandLastName(e.target.value)}
                    placeholder="e.g. Doe"
                    autoComplete="off"
                    style={{ width: '100%' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)', display: 'block', marginBottom: '0.25rem' }}>Email address</label>
                <input
                  type="email"
                  value={candEmail}
                  onChange={(e) => setCandEmail(e.target.value)}
                  placeholder="e.g. john.doe@example.com"
                  autoComplete="off"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)', display: 'block', marginBottom: '0.25rem' }}>Phone number</label>
                <input
                  type="text"
                  value={candPhone}
                  onChange={(e) => setCandPhone(e.target.value)}
                  placeholder="e.g. +1 555-0199"
                  autoComplete="off"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Redesigned Custom FileUpload Control */}
              <FileUpload
                value={selectedResumeFile}
                existingFileUrl={editingCandidate?.resume_url}
                onChange={setSelectedResumeFile}
                label={editingCandidateId ? 'Update resume file' : 'Upload resume file'}
                accept=".pdf,.docx,.txt"
                maxSizeMB={10}
                isProcessing={loading}
              />

              <Button variant="primary" size="md" type="submit" isLoading={loading} style={{ marginTop: '0.5rem' }}>
                {editingCandidateId ? 'Save changes' : 'Create profile & parse'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Structured Candidate Roster Table */}
        <Card>
          <CardHeader>
            <CardTitle>Candidates directory ({candidates.length})</CardTitle>
          </CardHeader>
          <CardContent style={{ padding: 0 }}>
            {candidates.length === 0 ? (
              <div style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', textAlign: 'center', padding: '3rem 1rem' }}>
                No candidate records found in workspace.
              </div>
            ) : (
              <table className="roster-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Contact</th>
                    <th>Experience</th>
                    <th>Key skills</th>
                    <th>Resume</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((cand) => {
                    const isEditing = editingCandidateId === cand.id

                    return (
                      <tr key={cand.id} style={{ backgroundColor: isEditing ? 'var(--bg-surface)' : undefined }}>
                        {/* Candidate Name in Source Serif 4 */}
                        <td>
                          <div style={{ fontFamily: "var(--font-serif, 'Source Serif 4', Georgia, serif)", fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink-primary)' }}>
                            {cand.first_name} {cand.last_name}
                          </div>
                        </td>

                        {/* Contact */}
                        <td>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--ink-primary)' }}>{cand.email}</div>
                          {cand.phone && <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>{cand.phone}</div>}
                        </td>

                        {/* Experience */}
                        <td>
                          {cand.estimated_experience_years > 0 ? (
                            <span style={{ fontSize: '0.8125rem', color: 'var(--ink-primary)' }}>{cand.estimated_experience_years} yrs</span>
                          ) : (
                            <span style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>—</span>
                          )}
                        </td>

                        {/* Skills: Neutral flat bordered tags */}
                        <td>
                          {cand.parsed_skills && cand.parsed_skills.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                              {cand.parsed_skills.slice(0, 4).map((skill: string, idx: number) => (
                                <Badge key={idx} variant="outline" style={{ fontSize: '0.7rem' }}>
                                  {skill}
                                </Badge>
                              ))}
                              {cand.parsed_skills.length > 4 && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', alignSelf: 'center' }}>
                                  +{cand.parsed_skills.length - 4}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>None extracted</span>
                          )}
                        </td>

                        {/* Resume File */}
                        <td>
                          {cand.resume_url ? (
                            <a
                              href={`http://localhost:8000${cand.resume_url}${token ? `?token=${token}` : ''}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontSize: '0.8125rem', color: 'var(--accent-navy)', fontWeight: 600, textDecoration: 'underline' }}
                            >
                              Download
                            </a>
                          ) : (
                            <span style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>No file</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.375rem' }}>
                            <Button variant="outline" size="sm" onClick={() => onEditClick(cand)}>
                              Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => onDeleteClick(cand.id)}>
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
