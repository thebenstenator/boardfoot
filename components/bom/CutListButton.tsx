'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CutListView } from '@/components/bom/CutListView'

interface CutListButtonProps {
  projectId: string
}

export function CutListButton({ projectId: _ }: CutListButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="cursor-pointer"
      >
        Cut List
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Cut List Optimizer</DialogTitle>
            <DialogDescription>
              Optimized layout for cutting your lumber from stock boards.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6">
            <CutListView />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
