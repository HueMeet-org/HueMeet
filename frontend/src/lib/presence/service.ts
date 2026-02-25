import { SupabaseClient } from '@supabase/supabase-js'

interface PresencePayload {
  username: string
  online_at: string
}

let presenceChannel: ReturnType<SupabaseClient['channel']> | null = null

export async function setUserOnline(
  supabase: SupabaseClient,
  username: string
): Promise<void> {

  // Create channel if it doesn't exist
  if (!presenceChannel) {
    presenceChannel = supabase.channel('presence-channel')
    await presenceChannel.on('presence', { event: 'sync' }, () => { }).subscribe()
  }

  // Track this user's presence
  await presenceChannel.track({
    username: username,
    online_at: new Date().toISOString(),
  })
}

export async function setUserOffline(supabase: SupabaseClient): Promise<void> {
  if (presenceChannel) {
    await presenceChannel.untrack()
    await supabase.removeChannel(presenceChannel)
    presenceChannel = null
  }
}


export function getPresenceChannel(supabase: SupabaseClient) {
  if (!presenceChannel) {
    presenceChannel = supabase.channel('presence-channel')
    presenceChannel.on('presence', { event: 'sync' }, () => { }).subscribe()
  }
  return presenceChannel
}

export function isUserOnline(username: string): boolean {
  if (!presenceChannel) return false

  const state = presenceChannel.presenceState<PresencePayload>()
  const allUsers = Object.values(state).flat()

  return allUsers.some(user => user.username === username)
}
