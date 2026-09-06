import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'

interface KanbanCardProps {
  app: any
  candidate: any
  job: any
  stages: { key: string; label: string }[]
  isPro: boolean
  onScoreApplication: (appId: string) => void
  onUpdateStage: (appId: string, stage: string) => void
  isOverlay?: boolean
}

export function KanbanCard({
  app,
  candidate,
  job,
  stages,
  isPro,
  onScoreApplication,
  onUpdateStage,
  isOverlay = false
}: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: app.id,
    data: { app, stage: app.stage }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    backgroundColor: 'var(--bg-surface)',
    borderRadius: '6px',
    padding: '0.875rem',
    border: isDragging ? '1px dashed var(--accent-navy, #1e3a8a)' : '1px solid var(--border-color)',
    boxShadow: isOverlay ? '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
    cursor: isDragging ? 'grabbing' : 'default',
    userSelect: 'none' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.625rem',
    position: 'relative' as const
  }

  const candName = candidate ? `${candidate.first_name} ${candidate.last_name}` : 'Candidate profile'
  const jobTitle = job ? job.title : 'Job posting'

  return (
    <div ref={setNodeRef} style={style}>
      {/* Header: Drag Handle & Name */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "var(--font-serif, 'Source Serif 4', Georgia, serif)",
            fontWeight: 600,
            fontSize: '0.9375rem',
            color: 'var(--ink-primary)',
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {candName}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {jobTitle}
          </div>
        </div>

        {/* Drag Handle Grip */}
        <div
          {...attributes}
          {...listeners}
          title="Drag card to move stage"
          style={{
            cursor: 'grab',
            padding: '0.2rem',
            borderRadius: '4px',
            color: 'var(--ink-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <GripVertical style={{ width: '16px', height: '16px' }} />
        </div>
      </div>

      {/* ATS Match Score */}
      {app.ats_score !== null && app.ats_score !== undefined ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.375rem 0.625rem',
          borderRadius: '4px',
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => onScoreApplication(app.id)}
              style={{ width: '100%', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
            >
              Calculate ATS score
            </Button>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--status-pending)', fontStyle: 'italic' }}>
              Score gated (Pro)
            </span>
          )}
        </div>
      )}

      {/* Accessible Stage Selector */}
      <div style={{ marginTop: '0.15rem' }}>
        <label style={{ fontSize: '0.6875rem', color: 'var(--ink-muted)', display: 'block', marginBottom: '0.15rem' }}>
          Move stage:
        </label>
        <select
          value={app.stage}
          onChange={(e) => onUpdateStage(app.id, e.target.value)}
          style={{
            width: '100%',
            padding: '0.3rem 0.5rem',
            fontSize: '0.75rem',
            borderRadius: '4px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-canvas)',
            color: 'var(--ink-primary)',
            outline: 'none'
          }}
        >
          {stages.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
