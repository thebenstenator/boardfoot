'use client'

import { createContext, useContext } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import type { DraggableAttributes } from '@dnd-kit/core'

// ─── Context ──────────────────────────────────────────────────────────────────
// SortableRow provides drag listeners down to DragHandle via context so the
// handle can be placed anywhere in the row without prop-drilling.

type DragHandleContextValue = {
  listeners: SyntheticListenerMap | undefined
  attributes: DraggableAttributes
}

const DragHandleContext = createContext<DragHandleContextValue>({
  listeners: undefined,
  attributes: {
    role: 'button',
    tabIndex: 0,
    'aria-disabled': false,
    'aria-pressed': undefined,
    'aria-roledescription': 'sortable',
    'aria-describedby': '',
  },
})

// ─── SortableRow ──────────────────────────────────────────────────────────────

export function SortableRow({
  id,
  children,
}: {
  id: string
  children: React.ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  return (
    <DragHandleContext.Provider value={{ listeners, attributes }}>
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isDragging ? 0.4 : undefined,
          position: isDragging ? 'relative' : undefined,
          zIndex: isDragging ? 10 : undefined,
        }}
      >
        {children}
      </div>
    </DragHandleContext.Provider>
  )
}

// ─── DragHandle ───────────────────────────────────────────────────────────────

export function DragHandle() {
  const { listeners, attributes } = useContext(DragHandleContext)
  return (
    <button
      type="button"
      {...listeners}
      {...attributes}
      aria-label="Drag to reorder"
      className="cursor-grab active:cursor-grabbing touch-none
        text-muted-foreground/40 hover:text-muted-foreground
        focus:outline-none leading-none px-0.5 py-px select-none"
    >
      <span className="text-sm">⠿</span>
    </button>
  )
}
