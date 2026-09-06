import { useState, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  closestCorners
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'
import { api } from '../../lib/api'

interface KanbanBoardProps {
  initialApplications: any[]
  jobs: any[]
  candidates: any[]
  isPro: boolean
  onScoreApplication: (appId: string) => void
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
}

export const KANBAN_STAGES = [
  { key: 'applied', label: 'Applied', color: '#3b82f6' },
  { key: 'screening', label: 'Screening', color: '#8b5cf6' },
  { key: 'interview', label: 'Interview', color: '#f59e0b' },
  { key: 'offer', label: 'Offer', color: '#06b6d4' },
  { key: 'hired', label: 'Hired', color: '#10b981' },
  { key: 'rejected', label: 'Rejected', color: '#ef4444' }
]

export function KanbanBoard({
  initialApplications,
  jobs,
  candidates,
  isPro,
  onScoreApplication,
  showToast
}: KanbanBoardProps) {
  const queryClient = useQueryClient()
  const [localApps, setLocalApps] = useState<any[]>(initialApplications)
  const [activeApp, setActiveApp] = useState<any | null>(null)

  const [initialStage, setInitialStage] = useState<string | null>(null)

  // Keep local state in sync when parent initialApplications updates
  useEffect(() => {
    setLocalApps(initialApplications)
  }, [initialApplications])

  // Setup sensors for pointer and keyboard drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  // TanStack Query Mutation with Optimistic Updates
  const updateStageMutation = useMutation({
    mutationFn: async ({ appId, stage }: { appId: string; stage: string }) => {
      const res = await api.patch(`/applications/${appId}/stage`, {
        stage,
        notes: `Moved stage to ${stage}`
      })
      return res.data
    },
    onMutate: async ({ appId, stage }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['applications'] })

      // Snapshot previous value for rollback if needed
      const previousApps = queryClient.getQueryData<any[]>(['applications']) || localApps

      // Optimistically update local state immediately
      setLocalApps((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, stage } : app))
      )

      return { previousApps }
    },
    onError: (err: any, _vars, context) => {
      // Rollback on failure
      if (context?.previousApps) {
        setLocalApps(context.previousApps)
      }
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to update application stage'
      showToast(errorMsg, 'error')
    },
    onSuccess: (_data, { stage }) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      const stageLabel = KANBAN_STAGES.find((s) => s.key === stage)?.label || stage
      showToast(`Candidate moved to ${stageLabel}`, 'success')
    }
  })

  const handleUpdateStage = (appId: string, newStage: string) => {
    const currentApp = localApps.find((a) => a.id === appId)
    if (!currentApp || currentApp.stage === newStage) {
      return
    }
    updateStageMutation.mutate({ appId, stage: newStage })
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const app = localApps.find((a) => a.id === active.id)
    if (app) {
      setActiveApp(app)
      setInitialStage(app.stage)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find source application
    const activeAppItem = localApps.find((a) => a.id === activeId)
    if (!activeAppItem) return

    // Determine target stage: either dropped on a column (stage key) or on another card in that stage
    let targetStage: string | null = null

    if (KANBAN_STAGES.some((s) => s.key === overId)) {
      targetStage = overId
    } else {
      const overApp = localApps.find((a) => a.id === overId)
      if (overApp) {
        targetStage = overApp.stage
      }
    }

    if (targetStage && activeAppItem.stage !== targetStage) {
      setLocalApps((prev) =>
        prev.map((a) => (a.id === activeId ? { ...a, stage: targetStage! } : a))
      )
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    const startStage = initialStage || activeApp?.stage
    setActiveApp(null)
    setInitialStage(null)

    if (!over) {
      // Revert if dropped outside
      if (startStage && activeApp) {
        setLocalApps((prev) =>
          prev.map((a) => (a.id === active.id ? { ...a, stage: startStage } : a))
        )
      }
      return
    }

    const activeId = active.id as string
    const overId = over.id as string

    let targetStage: string | null = null
    if (KANBAN_STAGES.some((s) => s.key === overId)) {
      targetStage = overId
    } else {
      const overApp = localApps.find((a) => a.id === overId)
      if (overApp) targetStage = overApp.stage
    }

    if (targetStage && startStage && targetStage !== startStage) {
      // Perform server mutation only if the stage actually changed
      updateStageMutation.mutate({ appId: activeId, stage: targetStage })
    } else if (startStage) {
      // Ensure local state is restored to original stage if dropped in same column
      setLocalApps((prev) =>
        prev.map((a) => (a.id === activeId ? { ...a, stage: startStage } : a))
      )
    }
  }

  const activeCand = activeApp ? candidates.find((c) => c.id === activeApp.candidate_id) || activeApp.candidate : null
  const activeJob = activeApp ? jobs.find((j) => j.id === activeApp.job_posting_id) || activeApp.job_posting : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/* 6 Stage Kanban Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, minmax(240px, 1fr))',
        gap: '1rem',
        overflowX: 'auto',
        paddingBottom: '0.75rem',
        alignItems: 'start'
      }}>
        {KANBAN_STAGES.map((stage) => (
          <KanbanColumn
            key={stage.key}
            stage={stage}
            stages={KANBAN_STAGES}
            applications={localApps}
            candidates={candidates}
            jobs={jobs}
            isPro={isPro}
            onScoreApplication={onScoreApplication}
            onUpdateStage={handleUpdateStage}
          />
        ))}
      </div>

      {/* Floating Drag Overlay */}
      <DragOverlay>
        {activeApp ? (
          <KanbanCard
            app={activeApp}
            candidate={activeCand}
            job={activeJob}
            stages={KANBAN_STAGES}
            isPro={isPro}
            onScoreApplication={onScoreApplication}
            onUpdateStage={handleUpdateStage}
            isOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
