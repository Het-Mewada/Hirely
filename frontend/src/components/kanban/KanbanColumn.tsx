import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Card, CardHeader, CardContent } from '../ui/card'
import { KanbanCard } from './KanbanCard'

interface Stage {
  key: string
  label: string
  color: string
}

interface KanbanColumnProps {
  stage: Stage
  stages: Stage[]
  applications: any[]
  candidates: any[]
  jobs: any[]
  isPro: boolean
  onScoreApplication: (appId: string) => void
  onUpdateStage: (appId: string, stage: string) => void
}

export function KanbanColumn({
  stage,
  stages,
  applications,
  candidates,
  jobs,
  isPro,
  onScoreApplication,
  onUpdateStage
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.key
  })

  const stageApps = applications.filter((a) => a.stage === stage.key)
  const appIds = stageApps.map((a) => a.id)

  return (
    <div ref={setNodeRef} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Card style={{
        height: '100%',
        minHeight: '480px',
        backgroundColor: 'var(--bg-canvas)',
        border: isOver ? '1.5px solid var(--accent-navy, #1e3a8a)' : '1px solid var(--border-color)',
        boxShadow: isOver ? '0 0 12px rgba(30, 58, 138, 0.12)' : 'none',
        transition: 'all 0.15s ease',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Column Header */}
        <CardHeader style={{
          padding: '0.875rem 1rem',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-surface)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Stage Color Indicator */}
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: stage.color,
              flexShrink: 0
            }} />
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink-primary)' }}>
              {stage.label}
            </div>
          </div>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--ink-muted)',
            backgroundColor: 'var(--bg-canvas)',
            padding: '0.15rem 0.5rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)'
          }}>
            {stageApps.length}
          </span>
        </CardHeader>

        {/* Column Scrollable Content Area */}
        <CardContent style={{
          padding: '0.75rem',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          overflowY: 'auto'
        }}>
          <SortableContext items={appIds} strategy={verticalListSortingStrategy}>
            {stageApps.length === 0 ? (
              <div style={{
                fontSize: '0.8125rem',
                color: 'var(--ink-muted)',
                textAlign: 'center',
                padding: '3rem 1rem',
                borderRadius: '4px',
                border: '1px dashed var(--border-color)',
                backgroundColor: isOver ? 'var(--bg-surface)' : 'transparent',
                transition: 'background-color 0.15s ease'
              }}>
                Drop candidate here
              </div>
            ) : (
              stageApps.map((app) => {
                const cand = candidates.find((c) => c.id === app.candidate_id) || app.candidate
                const job = jobs.find((j) => j.id === app.job_posting_id) || app.job_posting

                return (
                  <KanbanCard
                    key={app.id}
                    app={app}
                    candidate={cand}
                    job={job}
                    stages={stages}
                    isPro={isPro}
                    onScoreApplication={onScoreApplication}
                    onUpdateStage={onUpdateStage}
                  />
                )
              })
            )}
          </SortableContext>
        </CardContent>
      </Card>
    </div>
  )
}
