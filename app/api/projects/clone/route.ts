import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { projectId } = body as { projectId: string }

  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
  }

  // Verify source project exists and is public
  const { data: sourceProject } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('is_public', true)
    .single()

  if (!sourceProject) {
    return NextResponse.json({ error: 'Project not found or not public' }, { status: 404 })
  }

  // Check free tier project cap
  const { count } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'active')

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  if (profile?.subscription_tier === 'free' && (count ?? 0) >= 3) {
    return NextResponse.json({ error: 'project_limit_reached' }, { status: 403 })
  }

  // Copy the project
  const { data: newProject, error: projectError } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name: `${sourceProject.name} (copy)`,
      notes: sourceProject.notes,
      waste_factor: sourceProject.waste_factor,
      surface_area_sqft: sourceProject.surface_area_sqft,
      status: 'active',
      is_public: false,
    })
    .select()
    .single()

  if (projectError || !newProject) {
    return NextResponse.json({ error: projectError?.message ?? 'Failed to create project' }, { status: 500 })
  }

  // Fetch all line items in parallel
  const [
    { data: lumberItems },
    { data: hardwareItems },
    { data: finishItems },
  ] = await Promise.all([
    supabase.from('lumber_items').select('*').eq('project_id', projectId),
    supabase.from('hardware_items').select('*').eq('project_id', projectId),
    supabase.from('finish_items').select('*').eq('project_id', projectId),
  ])

  // Copy line items
  const insertPromises: Promise<unknown>[] = []

  // LOW: Explicit allowlists rather than ...rest so new columns (admin flags,
  // audit fields, etc.) are never silently copied to cloned projects.
  if (lumberItems && lumberItems.length > 0) {
    const copies = lumberItems.map((item) => ({
      project_id: newProject.id,
      species: item.species,
      thickness_in: item.thickness_in,
      width_in: item.width_in,
      length_ft: item.length_ft,
      length_unit: item.length_unit,
      quantity: item.quantity,
      pricing_mode: item.pricing_mode,
      price_per_unit: item.price_per_unit,
      is_reclaimed: item.is_reclaimed,
      waste_override: item.waste_override,
      notes: item.notes,
      sort_order: item.sort_order,
    }))
    insertPromises.push(Promise.resolve(supabase.from('lumber_items').insert(copies)))
  }

  if (hardwareItems && hardwareItems.length > 0) {
    const copies = hardwareItems.map((item) => ({
      project_id: newProject.id,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unit_cost: item.unit_cost,
      notes: item.notes,
      sort_order: item.sort_order,
    }))
    insertPromises.push(Promise.resolve(supabase.from('hardware_items').insert(copies)))
  }

  if (finishItems && finishItems.length > 0) {
    const copies = finishItems.map((item) => ({
      project_id: newProject.id,
      description: item.description,
      container_cost: item.container_cost,
      container_size: item.container_size,
      amount_used: item.amount_used,
      fraction_used: item.fraction_used,
      unit: item.unit,
      notes: item.notes,
      sort_order: item.sort_order,
    }))
    insertPromises.push(Promise.resolve(supabase.from('finish_items').insert(copies)))
  }

  await Promise.all(insertPromises)

  return NextResponse.json({ projectId: newProject.id })
}
