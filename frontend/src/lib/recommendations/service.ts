import { createClient } from '@/lib/supabase/client'

export type RecommendedUser = {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  aura?: number
  shared_interests_count?: number
  interests?: Array<{
    id: string
    name: string
    icon: string | null
  }>
}

// Get user's interests
export async function getUserInterests(userId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('user_interests')
    .select('interest_id')
    .eq('user_id', userId)
  
  if (error) {
    console.error('Error fetching interests:', error)
    return []
  }
  
  return data.map(item => item.interest_id)
}

// Get user's connections (to exclude)
export async function getUserConnections(userId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('connections')
    .select('sender_id, receiver_id, status')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
  
  if (error) {
    console.error('Error fetching connections:', error)
    return []
  }
  
  // Extract all connected user IDs (accepted, pending, rejected)
  return data.flatMap(conn => 
    [conn.sender_id, conn.receiver_id].filter(id => id !== userId)
  )
}

// Get recommended users based on shared interests
export async function getRecommendedUsers(userId: string, limit = 20): Promise<RecommendedUser[]> {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase.rpc('get_recommended_users', { current_user_id: userId })

    if (error) {
      console.error('Error fetching recommended users:', error)
      return []
    }

    return data as RecommendedUser[]

  } catch (error) {
    console.error('Unexpected error in getRecommendedUsers:', error)
    return []
  }
}

// Get new users (recently joined)
export async function getNewUsers(userId: string, limit = 20): Promise<RecommendedUser[]> {
  const supabase = createClient()
  
  const connectedUserIds = await getUserConnections(userId)
  
  let query = supabase
    .from('profiles')
    .select(`
      id,
      username,
      full_name,
      avatar_url,
      bio,
      created_at
    `)
    .neq('id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (connectedUserIds.length > 0) {
    query = query.not('id', 'in', `(${connectedUserIds.join(',')})`)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching new users:', error)
    return []
  }
  
  return data || []
}

// Send connection request
export async function sendConnectionRequest(receiverId: string) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('connections')
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      status: 'pending'
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}