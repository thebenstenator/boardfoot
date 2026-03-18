'use client'

import { useEffect } from 'react'
import { useProjectStore } from '@/store/projectStore'
import { LumberSection } from '@/components/bom/LumberSection'

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
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">{project.name}</h1>
      <LumberSection projectId={projectId} />
    </div>
  )
}