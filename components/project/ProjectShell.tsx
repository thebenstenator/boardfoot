'use client'

import { useEffect } from 'react'
import { useProjectStore } from '@/store/projectStore'
import { LumberSection } from '@/components/bom/LumberSection'
import { HardwareSection } from '@/components/bom/HardwareSection'
import { FinishSection } from '@/components/bom/FinishSection'
import { CostSummary } from '@/components/bom/CostSummary'

interface ProjectShellProps {
  projectId: string
}

export function ProjectShell({ projectId }: ProjectShellProps) {
  const { loadProject, project, isLoading } = useProjectStore()

  useEffect(() => {
    loadProject(projectId)
  }, [projectId, loadProject])

  if (isLoading) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        Loading project...
      </div>
    )
  }

  if (!project) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        Project not found.
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold">{project.name}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 items-start">
        <div className="space-y-10">
          <LumberSection projectId={projectId} />
          <HardwareSection projectId={projectId} />
          <FinishSection projectId={projectId} />
        </div>
        <div className="lg:sticky lg:top-8">
          <CostSummary />
        </div>
      </div>
    </div>
  )
}