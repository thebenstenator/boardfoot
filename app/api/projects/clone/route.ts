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

  if (lumberItems && lumberItems.length > 0) {
    const copies = lumberItems.map(({ id: _id, project_id: _pid, ...rest }) => ({
      ...rest,
      project_id: newProject.id,
    }))
    insertPromises.push(supabase.from('lumber_items').insert(copies))
  }

  if (hardwareItems && hardwareItems.length > 0) {
    const copies = hardwareItems.map(({ id: _id, project_id: _pid, ...rest }) => ({
      ...rest,
      project_id: newProject.id,
    }))
    insertPromises.push(supabase.from('hardware_items').insert(copies))
  }

  if (finishItems && finishItems.length > 0) {
    const copies = finishItems.map(({ id: _id, project_id: _pid, ...rest }) => ({
      ...rest,
      project_id: newProject.id,
    }))
    insertPromises.push(supabase.from('finish_items').insert(copies))
  }

  await Promise.all(insertPromises)

  return NextResponse.json({ projectId: newProject.id })
}
