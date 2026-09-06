import { useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'

interface AuditPageProps {
  auditLogs: any[]
  fetchAuditLogs: () => void
  loading: boolean
}

export function AuditPage({ auditLogs, fetchAuditLogs }: AuditPageProps) {
  useEffect(() => {
    fetchAuditLogs()
  }, [])

  const formatKey = (key: string) => {
    return key
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase()
  }

  const renderDetailValue = (val: any) => {
    if (val === null || val === undefined) return <span style={{ color: 'var(--ink-muted)' }}>N/A</span>
    if (typeof val === 'boolean') {
      return (
        <Badge variant={val ? 'warning' : 'outline'} style={{ fontSize: '0.7rem' }}>
          {val ? 'True' : 'False'}
        </Badge>
      )
    }
    if (typeof val === 'object') {
      return <code style={{ fontSize: '0.75rem', color: 'var(--ink-primary)', wordBreak: 'break-all' }}>{JSON.stringify(val)}</code>
    }
    return <span style={{ fontWeight: 600, color: 'var(--ink-primary)', wordBreak: 'break-all' }}>{String(val)}</span>
  }

  const renderFormattedDetails = (details: any) => {
    if (!details || typeof details !== 'object' || Object.keys(details).length === 0) return null

    return (
      <div style={{
        backgroundColor: 'var(--bg-canvas)',
        borderRadius: '4px',
        padding: '0.75rem 1rem',
        border: '1px solid var(--border-color)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.875rem',
        fontSize: '0.8125rem',
        marginTop: '0.25rem'
      }}>
        {Object.entries(details).map(([key, val]) => (
          <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', fontWeight: 600 }}>
              {formatKey(key)}
            </span>
            <div>{renderDetailValue(val)}</div>
          </div>
        ))}
      </div>
    )
  }

  const getActorDisplay = (log: any) => {
    if (log.actor_name && log.actor_email && log.actor_name !== log.actor_email) {
      return `${log.actor_name} (${log.actor_email})`
    }
    if (log.actor_name) return log.actor_name
    if (log.actor_email) return log.actor_email
    if (log.user?.full_name) return `${log.user.full_name} (${log.user.email || ''})`
    if (log.user?.email) return log.user.email
    if (log.details?.resumed_by) return log.details.resumed_by
    if (log.details?.cancelled_by) return log.details.cancelled_by
    if (log.details?.updated_by) return log.details.updated_by
    if (log.actor_id) return `User (${String(log.actor_id).slice(0, 8)}...)`
    return 'System automated'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-serif, 'Source Serif 4', Georgia, serif)", fontSize: '1.75rem', fontWeight: 600, color: 'var(--ink-primary)', margin: 0 }}>
            Audit logs
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginTop: '0.25rem' }}>
            Immutable record of security events, administrative role changes, and subscription actions.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchAuditLogs}>
          Refresh audit stream
        </Button>
      </div>

      {/* Audit Stream Card */}
      <Card>
        <CardHeader>
          <CardTitle>Recorded audit log stream ({auditLogs.length})</CardTitle>
        </CardHeader>

        <CardContent style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem', maxHeight: '650px', overflowY: 'auto' }}>
          {auditLogs.length === 0 ? (
            <div style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', textAlign: 'center', padding: '3rem 0' }}>
              No audit log events recorded yet.
            </div>
          ) : (
            auditLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderRadius: '4px',
                  padding: '1rem',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--accent-navy)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <code>{log.action}</code>
                    <Badge variant="outline" style={{ fontSize: '0.7rem' }}>{log.target_type}</Badge>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                    {new Date(log.created_at || log.timestamp).toLocaleString()}
                  </div>
                </div>

                {/* Actor Display */}
                <div style={{ fontSize: '0.8125rem', color: 'var(--ink-primary)' }}>
                  <span style={{ color: 'var(--ink-muted)' }}>Actor: </span>
                  <span style={{ fontWeight: 600 }}>{getActorDisplay(log)}</span>
                </div>

                {/* Formatted Key-Value Details Card */}
                {renderFormattedDetails(log.details)}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
