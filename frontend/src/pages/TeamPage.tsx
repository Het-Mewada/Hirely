import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { ConfirmationModal } from '../components/ui/ConfirmationModal'
import { api } from '../lib/api'

interface UserItem {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'recruiter' | 'hiring_manager'
  is_active: boolean
  created_at?: string
}

interface TeamPageProps {
  currentRole?: string
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void
  fetchAuditLogs?: () => void
}

export function TeamPage({ currentRole, showToast, fetchAuditLogs }: TeamPageProps) {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(false)
  const [inviting, setInviting] = useState(false)

  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteFullName, setInviteFullName] = useState('')
  const [invitePassword, setInvitePassword] = useState('HirelyPass2026!')
  const [inviteRole, setInviteRole] = useState<'admin' | 'recruiter' | 'hiring_manager'>('recruiter')
  const [lastInvitedCredentials, setLastInvitedCredentials] = useState<{ email: string; pass: string; role: string } | null>(null)

  // Delete User Confirmation State
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserItem | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/users')
      setUsers(res.data)
    } catch (err: any) {
      console.error('Failed to fetch team members', err)
      showToast(err.response?.data?.detail || 'Failed to fetch team members', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail || !inviteFullName) return

    setInviting(true)
    const initialPass = invitePassword || 'HirelyPass2026!'
    try {
      await api.post('/users/invite', {
        email: inviteEmail.trim(),
        full_name: inviteFullName.trim(),
        role: inviteRole,
        password: initialPass
      })
      showToast(`Invited ${inviteFullName}! Temporary Password: ${initialPass}`, 'success')
      setLastInvitedCredentials({
        email: inviteEmail.trim(),
        pass: initialPass,
        role: inviteRole.replace('_', ' ')
      })
      setInviteEmail('')
      setInviteFullName('')
      setInvitePassword('HirelyPass2026!')
      setInviteRole('recruiter')
      fetchUsers()
      if (fetchAuditLogs) fetchAuditLogs()
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to invite team member', 'error')
    } finally {
      setInviting(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'recruiter' | 'hiring_manager') => {
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole })
      showToast('User role updated successfully', 'success')
      fetchUsers()
      if (fetchAuditLogs) fetchAuditLogs()
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to update user role', 'error')
      fetchUsers()
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return
    const userId = deleteConfirmUser.id
    setDeleteConfirmUser(null)

    try {
      await api.delete(`/users/${userId}`)
      showToast('Team member removed from workspace', 'success')
      fetchUsers()
      if (fetchAuditLogs) fetchAuditLogs()
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to remove user', 'error')
    }
  }

  const isAdmin = currentRole === 'admin'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontFamily: "var(--font-serif, 'Source Serif 4', Georgia, serif)", fontSize: '1.75rem', fontWeight: 600, color: 'var(--ink-primary)', margin: 0 }}>
          Team & Role Management
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginTop: '0.25rem' }}>
          Invite recruiters and hiring managers, manage team access, and assign workspace roles.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '360px 1fr' : '1fr', gap: '1.75rem', alignItems: 'start' }}>
        {/* Invite User Card (Admin Only) */}
        {isAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Card>
              <CardHeader>
                <CardTitle>Invite team member</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInviteUser} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)', display: 'block', marginBottom: '0.25rem' }}>Full name</label>
                    <input
                      type="text"
                      value={inviteFullName}
                      onChange={(e) => setInviteFullName(e.target.value)}
                      placeholder="e.g. Sarah Connor"
                      autoComplete="off"
                      style={{ width: '100%' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)', display: 'block', marginBottom: '0.25rem' }}>Corporate email address</label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="sarah@acme.com"
                      autoComplete="off"
                      style={{ width: '100%' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)', display: 'block', marginBottom: '0.25rem' }}>Initial temporary password</label>
                    <input
                      type="text"
                      value={invitePassword}
                      onChange={(e) => setInvitePassword(e.target.value)}
                      placeholder="HirelyPass2026!"
                      autoComplete="off"
                      style={{ width: '100%' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)', display: 'block', marginBottom: '0.25rem' }}>Assign role</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as any)}
                      style={{ width: '100%' }}
                    >
                      <option value="admin">Admin (Full Control)</option>
                      <option value="recruiter">Recruiter (Jobs & Candidates)</option>
                      <option value="hiring_manager">Hiring Manager (Pipeline & Scoring)</option>
                    </select>
                  </div>

                  <Button variant="primary" size="md" type="submit" isLoading={inviting} style={{ marginTop: '0.5rem' }}>
                    Send team invite
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Last Invited Credentials Summary Box */}
            {lastInvitedCredentials && (
              <Card style={{ backgroundColor: 'var(--bg-canvas)' }}>
                <CardHeader>
                  <CardTitle style={{ fontSize: '0.9rem', color: 'var(--status-matched)' }}>
                    ✓ Active Login Credentials Created
                  </CardTitle>
                </CardHeader>
                <CardContent style={{ fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div><strong>Email:</strong> {lastInvitedCredentials.email}</div>
                  <div><strong>Role:</strong> {lastInvitedCredentials.role}</div>
                  <div><strong>Temp Password:</strong> <code style={{ backgroundColor: 'var(--bg-surface)', padding: '0.1rem 0.4rem', borderRadius: '3px' }}>{lastInvitedCredentials.pass}</code></div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '0.25rem' }}>
                    Share these credentials with the user to log in at <code>/login</code>.
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Team Members Roster Directory */}
        <Card>
          <CardHeader>
            <CardTitle>Team roster ({users.length})</CardTitle>
          </CardHeader>
          <CardContent style={{ padding: 0 }}>
            {loading ? (
              <div style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', textAlign: 'center', padding: '3rem 1rem' }}>
                Loading team directory...
              </div>
            ) : users.length === 0 ? (
              <div style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', textAlign: 'center', padding: '3rem 1rem' }}>
                No team members found.
              </div>
            ) : (
              <table className="roster-table">
                <thead>
                  <tr>
                    <th>Full name</th>
                    <th>Email address</th>
                    <th>Role</th>
                    {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontFamily: "var(--font-serif, 'Source Serif 4', Georgia, serif)", fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink-primary)' }}>
                          {u.full_name}
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--ink-primary)' }}>{u.email}</span>
                      </td>

                      <td>
                        <Badge variant={u.role === 'admin' ? 'matched' : u.role === 'recruiter' ? 'pending' : 'outline'}>
                          {u.role === 'admin' ? 'Admin' : u.role === 'recruiter' ? 'Recruiter' : 'Hiring Manager'}
                        </Badge>
                      </td>

                      {isAdmin && (
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value as any)}
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                backgroundColor: 'var(--bg-canvas)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--ink-primary)'
                              }}
                            >
                              <option value="admin">Admin</option>
                              <option value="recruiter">Recruiter</option>
                              <option value="hiring_manager">Hiring Manager</option>
                            </select>

                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeleteConfirmUser(u)}
                            >
                              Remove
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete User Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deleteConfirmUser)}
        title={deleteConfirmUser ? `Remove ${deleteConfirmUser.full_name}?` : ''}
        description="This will revoke their access to the workspace. If they are the last Admin, removal will be protected."
        confirmText="Remove member"
        isDestructive={true}
        onConfirm={handleDeleteUser}
        onClose={() => setDeleteConfirmUser(null)}
      />
    </div>
  )
}
