'use client'

import { useState } from 'react'
import { useHardwareItems } from '@/hooks/useLineItems'
import { useProjectStore } from '@/store/projectStore'
import type { HardwareItem, HardwareUnit } from '@/types/bom'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const UNIT_OPTIONS: HardwareUnit[] = ['each', 'box', 'pair', 'set', 'lb', 'oz']

interface EditableCellProps {
  value: string | number
  onChange: (value: string) => void
  type?: 'text' | 'number'
  className?: string
  tabIndex?: number
}

function EditableCell({
  value,
  onChange,
  type = 'text',
  className = '',
  tabIndex,
}: EditableCellProps) {
  const [draft, setDraft] = useState(String(value))
  const [focused, setFocused] = useState(false)

  function handleFocus() {
    setDraft(String(value))
    setFocused(true)
  }

  function handleBlur() {
    setFocused(false)
    onChange(draft)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') e.currentTarget.blur()
  }

  return (
    <input
      type={type}
      value={focused ? draft : String(value)}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      tabIndex={tabIndex}
      className={`w-full bg-transparent border border-transparent rounded px-1 py-0.5 text-sm
        focus:outline-none focus:border-ring focus:bg-background
        hover:border-border ${className}`}
    />
  )
}

interface HardwareSectionProps {
  projectId: string
}

export function HardwareSection({ projectId }: HardwareSectionProps) {
  const { items, addItem, updateItem, removeItem } = useHardwareItems(projectId)
  const totals = useProjectStore((state) => state.totals)

  const TAB_STOPS_PER_ROW = 5

  function handleUpdate(id: string, field: keyof HardwareItem, raw: string) {
    const numericFields = ['quantity', 'unit_cost']
    const value = numericFields.includes(field) ? parseFloat(raw) || 0 : raw
    updateItem(id, { [field]: value } as Partial<HardwareItem>)
  }

  function formatCurrency(n: number) {
    return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Hardware</h2>
        <Button size="sm" onClick={addItem}>+ Add hardware</Button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No hardware added yet. Click "+ Add hardware" to start.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
                <tr className="border-b text-muted-foreground text-xs">
                    <th className="text-left py-2 px-1 font-medium w-[20%]">Description</th>
                    <th className="text-left py-2 px-1 font-medium w-[12%]">Qty</th>
                    <th className="text-left py-2 px-1 font-medium w-[15%]">Unit</th>
                    <th className="text-left py-2 px-1 font-medium w-[13%]">Cost</th>
                    <th className="text-right py-2 px-1 font-medium w-[13%]">Total</th>
                    <th className="py-2 px-1 w-[7%]"></th>
                </tr>
                </thead>
            <tbody>
              {items.map((item, rowIndex) => {

                const TAB_OFFSET = 500
                const baseTab = rowIndex * TAB_STOPS_PER_ROW + TAB_OFFSET
                const lineTotal = item.quantity * item.unit_cost

                return (
                  <tr key={item.id} className="border-b hover:bg-muted/30">
                    <td className="py-1 px-1">
                      <EditableCell
                        value={item.description}
                        onChange={(v) => handleUpdate(item.id, 'description', v)}
                        tabIndex={baseTab}
                      />
                    </td>
                    <td className="py-1 px-1">
                      <EditableCell
                        value={item.quantity}
                        onChange={(v) => handleUpdate(item.id, 'quantity', v)}
                        type="number"
                        tabIndex={baseTab + 1}
                      />
                    </td>
                    <td className="py-1 px-1 w-24">
                      <Select
                        value={item.unit}
                        onValueChange={(v) => updateItem(item.id, { unit: v as HardwareUnit })}
                      >
                        <SelectTrigger className="h-7 w-full text-xs border-transparent hover:border-border focus:border-ring">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UNIT_OPTIONS.map((u) => (
                            <SelectItem key={u} value={u} className="text-xs">
                              {u}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-1 px-1">
                      <EditableCell
                        value={item.unit_cost}
                        onChange={(v) => handleUpdate(item.id, 'unit_cost', v)}
                        type="number"
                        tabIndex={baseTab + 3}
                      />
                    </td>
                    <td className="py-1 px-1 text-right">
                      {formatCurrency(lineTotal)}
                    </td>
                    <td className="py-1 px-1">
                      <button
                        onClick={() => removeItem(item.id)}
                        tabIndex={baseTab + 4}
                        className="cursor-pointer text-muted-foreground hover:text-destructive
                          text-xs px-1 focus:outline-none focus:ring-1 focus:ring-ring rounded"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {items.length > 0 && (
        <div className="flex justify-end text-sm pt-1">
          <span className="font-medium">
            Hardware total: {formatCurrency(totals.hardware.total)}
          </span>
        </div>
      )}
    </div>
  )
}