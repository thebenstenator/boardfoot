import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only create demo once
  const { data: profile } = await supabase
    .from('profiles')
    .select('has_seen_demo')
    .eq('id', user.id)
    .single()

  if (profile?.has_seen_demo) {
    return NextResponse.json({ skipped: true })
  }

  // Always mark as seen — existing users should not get a demo
  const { count } = await supabase
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'active')

  if (count && count > 0) {
    await supabase.from('profiles').update({ has_seen_demo: true }).eq('id', user.id)
    return NextResponse.json({ skipped: true })
  }

  // Create the demo project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name: 'Demo: Painted Bookshelf',
      notes: 'This is a demo project — explore it to see how BoardFoot works. Delete it whenever you\'re ready to start your own.',
      waste_factor: 0.15,
    })
    .select()
    .single()

  if (projectError || !project) {
    return NextResponse.json({ error: 'Failed to create demo project' }, { status: 500 })
  }

  const projectId = project.id

  // Lumber: Birch Plywood 3/4" × 48" × 8ft
  const { data: plywood } = await supabase
    .from('lumber_items')
    .insert({
      project_id: projectId,
      species: 'Birch Plywood',
      thickness_in: 0.75,
      width_in: 48,
      length_ft: 8,
      length_unit: 'ft',
      quantity: 2,
      pricing_mode: 'per_piece',
      price_per_unit: 85.00,
      sort_order: 0,
    })
    .select()
    .single()

  // Lumber: Poplar 1×4 @ $/LF
  const { data: poplar } = await supabase
    .from('lumber_items')
    .insert({
      project_id: projectId,
      species: 'Poplar',
      thickness_in: 1,
      width_in: 4,
      length_ft: 8,
      length_unit: 'ft',
      quantity: 3,
      pricing_mode: 'per_lf',
      price_per_unit: 2.60,
      sort_order: 1,
    })
    .select()
    .single()

  // Hardware
  await supabase.from('hardware_items').insert([
    {
      project_id: projectId,
      description: '1-1/4" pocket screws (coarse thread)',
      quantity: 100,
      unit: 'each',
      unit_cost: 0.05,
      sort_order: 0,
    },
    {
      project_id: projectId,
      description: '1-5/8" pocket screws (coarse thread)',
      quantity: 50,
      unit: 'each',
      unit_cost: 0.06,
      sort_order: 1,
    },
    {
      project_id: projectId,
      description: '5mm shelf pin clips (nickel)',
      quantity: 32,
      unit: 'each',
      unit_cost: 0.25,
      sort_order: 2,
    },
    {
      project_id: projectId,
      description: '5mm shelf pin drilling jig',
      quantity: 1,
      unit: 'each',
      unit_cost: 18.00,
      sort_order: 3,
    },
    {
      project_id: projectId,
      description: '2" finish nails (16 gauge)',
      quantity: 1,
      unit: 'box',
      unit_cost: 9.00,
      sort_order: 4,
    },
    {
      project_id: projectId,
      description: 'Wall stud anchors / 3" construction screws for wall attachment',
      quantity: 6,
      unit: 'each',
      unit_cost: 0.35,
      sort_order: 5,
    },
    {
      project_id: projectId,
      description: 'Iron-on birch edge banding (7/8" × 25 ft roll)',
      quantity: 1,
      unit: 'each',
      unit_cost: 14.00,
      sort_order: 6,
    },
  ])

  // Consumables
  await supabase.from('finish_items').insert([
    {
      project_id: projectId,
      description: 'Sandpaper 80-grit (sheets)',
      container_size: 20,
      container_cost: 12.00,
      amount_used: 2,
      fraction_used: 0.10,
      unit: 'discs',
      sort_order: 0,
    },
    {
      project_id: projectId,
      description: 'Sandpaper 120-grit (sheets)',
      container_size: 20,
      container_cost: 12.00,
      amount_used: 2,
      fraction_used: 0.10,
      unit: 'discs',
      sort_order: 1,
    },
    {
      project_id: projectId,
      description: 'Sandpaper 180-grit (sheets)',
      container_size: 20,
      container_cost: 12.00,
      amount_used: 2,
      fraction_used: 0.10,
      unit: 'discs',
      sort_order: 2,
    },
    {
      project_id: projectId,
      description: 'Sandpaper 220-grit (sheets)',
      container_size: 20,
      container_cost: 12.00,
      amount_used: 2,
      fraction_used: 0.10,
      unit: 'discs',
      sort_order: 3,
    },
    {
      project_id: projectId,
      description: 'Latex primer (quart)',
      container_size: 32,
      container_cost: 16.00,
      amount_used: 24,
      fraction_used: 0.75,
      unit: 'fl oz',
      sort_order: 4,
    },
    {
      project_id: projectId,
      description: 'Semi-gloss latex paint, white (quart)',
      container_size: 32,
      container_cost: 22.00,
      amount_used: 24,
      fraction_used: 0.75,
      unit: 'fl oz',
      sort_order: 5,
    },
    {
      project_id: projectId,
      description: 'Paintable wood filler / spackling (small tub)',
      container_size: 1,
      container_cost: 7.00,
      amount_used: 0.25,
      fraction_used: 0.25,
      unit: 'item',
      sort_order: 6,
    },
    {
      project_id: projectId,
      description: 'Tack cloth (pack of 6)',
      container_size: 6,
      container_cost: 6.00,
      amount_used: 1,
      fraction_used: 0.17,
      unit: 'item',
      sort_order: 7,
    },
  ])

  // Labor & overhead
  await supabase.from('project_labor').insert({
    project_id: projectId,
    hourly_rate: 15,
    estimated_hrs: 5,
    target_margin: 0.30,
  })

  // Cut parts — Birch Plywood (carcass)
  if (plywood) {
    await supabase.from('cut_parts').insert([
      {
        project_id: projectId,
        lumber_item_id: plywood.id,
        label: 'Top/Bottom',
        thickness_in: 0.75,
        width_in: 11.875,
        length_in: 28.5,
        quantity: 2,
        sort_order: 0,
      },
      {
        project_id: projectId,
        lumber_item_id: plywood.id,
        label: 'Sides',
        thickness_in: 0.75,
        width_in: 11.875,
        length_in: 96,
        quantity: 2,
        sort_order: 1,
      },
      {
        project_id: projectId,
        lumber_item_id: plywood.id,
        label: 'Shelf',
        thickness_in: 0.75,
        width_in: 11.875,
        length_in: 28.5,
        quantity: 8,
        sort_order: 2,
      },
    ])
  }

  // Cut parts — Poplar (face frame)
  if (poplar) {
    await supabase.from('cut_parts').insert([
      {
        project_id: projectId,
        lumber_item_id: poplar.id,
        label: 'Face frame horizontal',
        thickness_in: 0.75,
        width_in: 1.75,
        length_in: 28.5,
        quantity: 10,
        sort_order: 3,
      },
      {
        project_id: projectId,
        lumber_item_id: poplar.id,
        label: 'Face frame vertical',
        thickness_in: 0.75,
        width_in: 1.75,
        length_in: 96,
        quantity: 2,
        sort_order: 4,
      },
    ])
  }

  // Mark demo as seen
  await supabase
    .from('profiles')
    .update({ has_seen_demo: true })
    .eq('id', user.id)

  return NextResponse.json({ projectId })
}
