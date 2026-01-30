import { createClient } from '@/lib/supabase/client'
import { ConnectedUsers, UserPresence } from '@/types/user'

export type ConnectionRequest = {
  id: string
  sender_id: string
  receiver_id: string
  status: string
  created_at: string
  sender: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
    bio: string | null
  }
}

// Get incoming connection requests (requests YOU received)
export async function getIncomingRequests(userId: string): Promise<ConnectionRequest[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('connections')
    .select(`
      id,
      sender_id,
      receiver_id,
      status,
      created_at,
      sender:profiles!connections_sender_id_fkey (
        id,
        username,
        full_name,
        avatar_url,
        bio
      )
    `)
    .eq('receiver_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching incoming requests:', error)
    return []
  }

  return data as any[] || []
}

// Get outgoing connection requests (requests YOU sent)
export async function getOutgoingRequests(userId: string): Promise<ConnectionRequest[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('connections')
    .select(`
      id,
      sender_id,
      receiver_id,
      status,
      created_at,
      receiver:profiles!connections_receiver_id_fkey (
        id,
        username,
        full_name,
        avatar_url
      )
    `)
    .eq('sender_id', userId)
    .eq('status', 'pending');

  if (error) {
    console.error('Error fetching outgoing requests:', error)
    return []
  }

  return data as any[] || []
}

// Accept connection request
export async function acceptConnectionRequest(connectionId: string) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('connections')
    .update({ status: 'accepted' })
    .eq('id', connectionId)
    .eq('receiver_id', user.id) // Only receiver can accept
    .select()
    .single();

  if (error) {
    throw error
  }

  return data;
}

// Reject connection request
export async function rejectConnectionRequest(connectionId: string) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('connections')
    .update({ status: 'rejected' })
    .eq('id', connectionId)
    .eq('receiver_id', user.id) // Only receiver can reject
    .select()
    .single();

  if (error) {
    throw error
  }

  return data
}

// Cancel connection request (for sent requests)
export async function cancelConnectionRequest(connectionId: string) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase
    .from('connections')
    .delete()
    .eq('id', connectionId)
    .eq('sender_id', user.id); // Only sender can cancel

  if (error) {
    throw error
  }

  return true;
}

// Show all connected users
export async function getActiveConnections(userId: string): Promise<ConnectedUsers[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('connections')
    .select(`
      id,
      sender_id,
      receiver_id,
      sender:profiles!sender_id(id, full_name, username, avatar_url),
      receiver:profiles!receiver_id(id, full_name, username, avatar_url),
      messages(content, created_at, is_read, receiver_id),
      created_at,
      updated_at
    `)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .eq('status', 'accepted')
    .order('created_at', { ascending: false })
    .limit(1, { foreignTable: 'messages' })

  if (error) {
    throw error
  }

  // return after formatting into ConnectedUsers type
  const new_data: ConnectedUsers[] = data!.map(conn => {
    const sender = Array.isArray(conn.sender) ? conn.sender[0] : conn.sender
    const receiver = Array.isArray(conn.receiver) ? conn.receiver[0] : conn.receiver

    const isUserSender = conn.sender_id === userId
    const otherUser = isUserSender ? receiver : sender

    const messages = Array.isArray(conn.messages) ? conn.messages : (conn.messages ? [conn.messages] : [])
    const lastMessage = messages[0] || undefined

    const unreadCount = messages.filter(
      msg => !msg.is_read && msg.receiver_id === userId
    ).length

    return {
      id: otherUser.id as string,
      name: otherUser.full_name as string,
      username: otherUser.username as string,
      avatarUrl: otherUser.avatar_url as string | undefined,
      lastMessage: lastMessage?.content || undefined,
      lastMessageAt: conn.updated_at || conn.created_at as string,
      unreadCount,
      presence: 'offline' as UserPresence
    };
  });

  return new_data;
}