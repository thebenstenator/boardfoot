'use client'

import { useState } from 'react'
import { useLumberItems } from '@/hooks/useLineItems'
import { calculateBoardFeetFlexible } from '@/lib/calculations/boardFeet'
import { useProjectStore } from '@/store/projectStore'
import type { LumberItem, LengthUnit } from '@/types/bom'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

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
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    }
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
        hover:border-border
        ${className}`}
    />
  )
}

interface LengthCellProps {
  length: number
  unit: LengthUnit
  onLengthChange: (value: string) => void
  onUnitToggle: () => void
  tabIndex?: number
}

function LengthCell({
  length,
  unit,
  onLengthChange,
  onUnitToggle,
  tabIndex,
}: LengthCellProps) {
  return (
    <div className="flex items-center gap-0.5">
      <EditableCell
        value={length}
        onChange={onLengthChange}
        type="number"
        className="w-12"
        tabIndex={tabIndex}
      />
      <button
        onClick={onUnitToggle}
        tabIndex={tabIndex !== undefined ? tabIndex + 1 : undefined}
        className="cursor-pointer text-xs border rounded px-1.5 py-0.5 hover:bg-accent 
          focus:outline-none focus:ring-1 focus:ring-ring shrink-0"
      >
        {unit}
      </button>
    </div>
  )
}

interface LumberSectionProps {
  projectId: string
}

export function LumberSection({ projectId }: LumberSectionProps) {
  const { items, addItem, updateItem, removeItem } = useLumberItems(projectId)
  const project = useProjectStore((state) => state.project)
  const totals = useProjectStore((state) => state.totals)

  const wasteFactor = project?.waste_factor ?? 0.15
  const wastePercent = Math.round(wasteFactor * 100)

  // Number of tab stops per row — species, T, W, length, unit, qty, mode, price, delete = 9
  const TAB_STOPS_PER_ROW = 9

  function handleUpdate(id: string, field: keyof LumberItem, raw: string) {
    const numericFields = [
      'thickness_in', 'width_in', 'length_ft',
      'quantity', 'price_per_unit', 'waste_override',
    ]
    const value = numericFields.includes(field) ? parseFloat(raw) || 0 : raw
    updateItem(id, { [field]: value } as Partial<LumberItem>)
  }

function handleUnitToggle(item: LumberItem) {
  if (item.length_unit === 'ft') {
    const newLength = parseFloat((item.length_ft * 12).toFixed(3))
    updateItem(item.id, {
      length_unit: 'in',
      length_ft: newLength,
    })
  } else {
    const newLength = parseFloat((item.length_ft / 12).toFixed(3))
    updateItem(item.id, {
      length_unit: 'ft',
      length_ft: newLength,
    })
  }
}

  function formatCurrency(n: number) {
    return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
  }

  return (
    <TooltipProvider>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Lumber</h2>
          <Button size="sm" onClick={addItem}>+ Add lumber</Button>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No lumber added yet. Click "+ Add lumber" to start.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-xs">
                  <th className="text-left py-2 px-1 font-medium">Species</th>
                  <th className="text-left py-2 px-1 font-medium">T (in)</th>
                  <th className="text-left py-2 px-1 font-medium">W (in)</th>
                  <th className="text-left py-2 px-1 font-medium">Length</th>
                  <th className="text-left py-2 px-1 font-medium">Qty</th>
                  <th className="text-left py-2 px-1 font-medium">Mode</th>
                  <th className="text-left py-2 px-1 font-medium">$/unit</th>
                  <th className="text-right py-2 px-1 font-medium">BF</th>
                  <th className="text-right py-2 px-1 font-medium">Cost</th>
                  <th className="py-2 px-1"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, rowIndex) => {
                  const baseTab = rowIndex * TAB_STOPS_PER_ROW + 1
                  const bf = calculateBoardFeetFlexible(
                        item.thickness_in,
                        item.width_in,
                        item.length_ft,
                        (item.length_unit ?? 'ft') as LengthUnit
                    )
                  const totalBF = bf * item.quantity
                  const lineCost = totalBF * item.price_per_unit

                  return (
                    <tr key={item.id} className="border-b hover:bg-muted/30">
                      <td className="py-1 px-1">
                        <EditableCell
                          value={item.species}
                          onChange={(v) => handleUpdate(item.id, 'species', v)}
                          tabIndex={baseTab}
                        />
                      </td>
                      <td className="py-1 px-1">
                        <EditableCell
                          value={item.thickness_in}
                          onChange={(v) => handleUpdate(item.id, 'thickness_in', v)}
                          type="number"
                          tabIndex={baseTab + 1}
                        />
                      </td>
                      <td className="py-1 px-1">
                        <EditableCell
                          value={item.width_in}
                          onChange={(v) => handleUpdate(item.id, 'width_in', v)}
                          type="number"
                          tabIndex={baseTab + 2}
                        />
                      </td>
                      <td className="py-1 px-1">
                        <LengthCell
                          length={item.length_ft}
                          unit={item.length_unit as LengthUnit}
                          onLengthChange={(v) => handleUpdate(item.id, 'length_ft', v)}
                          onUnitToggle={() => handleUnitToggle(item)}
                          tabIndex={baseTab + 3}
                        />
                      </td>
                      <td className="py-1 px-1">
                        <EditableCell
                          value={item.quantity}
                          onChange={(v) => handleUpdate(item.id, 'quantity', v)}
                          type="number"
                          tabIndex={baseTab + 5}
                        />
                      </td>
                      <td className="py-1 px-1">
                        <button
                          onClick={() => updateItem(item.id, {
                            pricing_mode: item.pricing_mode === 'per_bf' ? 'per_lf' : 'per_bf'
                          })}
                          tabIndex={baseTab + 6}
                          className="cursor-pointer text-xs border rounded px-1.5 py-0.5 
                            hover:bg-accent focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          {item.pricing_mode === 'per_bf' ? '$/BF' : '$/LF'}
                        </button>
                      </td>
                      <td className="py-1 px-1">
                        <EditableCell
                          value={item.price_per_unit}
                          onChange={(v) => handleUpdate(item.id, 'price_per_unit', v)}
                          type="number"
                          tabIndex={baseTab + 7}
                        />
                      </td>
                      <td className="py-1 px-1 text-right text-muted-foreground">
                        {totalBF.toFixed(2)}
                      </td>
                      <td className="py-1 px-1 text-right">
                        {formatCurrency(lineCost)}
                      </td>
                      <td className="py-1 px-1">
                        <button
                          onClick={() => removeItem(item.id)}
                          tabIndex={baseTab + 8}
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
          <div className="flex justify-end gap-6 text-sm pt-1">
            <span className="text-muted-foreground">
              Net: {formatCurrency(totals.lumber.netCost)}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="font-medium cursor-help border-b border-dashed border-muted-foreground">
                  Adjusted for {wastePercent}% waste:{' '}
                  {formatCurrency(totals.lumber.adjustedCost)}
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Waste factor uses margin math: you need to purchase{' '}
                  {formatCurrency(totals.lumber.adjustedCost)} worth of lumber
                  to end up with {formatCurrency(totals.lumber.netCost)} of
                  usable material after waste.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}