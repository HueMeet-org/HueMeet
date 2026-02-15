import { createClient } from '@/lib/supabase/client';
import { ConnectedUsers, UserPresence } from '@/types/user';
import { isUserOnline } from '../presence/service';
import { createConversationParticipant } from '../messages/service';
import { decryptMessage } from '../encryption';
import { getSharedKeyForChat } from '../userKeyManager';

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
      created_at,
      updated_at
    `)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .eq('status', 'accepted');

  if (error) {
    throw error
  }

  // return after formatting into ConnectedUsers type
  const new_data: ConnectedUsers[] = await Promise.all(data!.map(async conn => {
    const sender = Array.isArray(conn.sender) ? conn.sender[0] : conn.sender;
    const receiver = Array.isArray(conn.receiver) ? conn.receiver[0] : conn.receiver;

    const isUserSender = conn.sender_id === userId;
    const otherUser = isUserSender ? receiver : sender;

    const { data: conversationData, error: conversationError } = await supabase
      .from('conversations')
      .select('id')
      .eq('connection_id', conn.id);

    if (conversationError) {
      throw conversationError;
    }

    // Getting conversation id - create one if it doesn't exist
    let conversationId = conversationData?.[0]?.id;

    if (!conversationId) {
      // Auto-create conversation for this connection
      // Auto-create conversation for this connection
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({ connection_id: conn.id })
        .select('id')
        .single();

      if (newConversation) {
        conversationId = newConversation.id;
      }

      if (createError) {
        console.error('Error creating conversation:', createError);
      }
    }

    // create participation record if it doesn't exist
    if (conversationId) {
      const { data: participant } = await supabase
        .from("conversation_participants")
        .select("id")
        .eq("conversation_id", conversationId)
        .eq("user_id", userId)
        .single();

      if (!participant) {
        await createConversationParticipant(conversationId, userId);
      }
    }

    // If conversationId is still null here (creation failed), we can't fetch messages properly.
    if (!conversationId) {
      console.error('No conversation ID for connection', conn.id);
      return {
        id: otherUser.id as string,
        name: otherUser.full_name as string,
        username: otherUser.username as string,
        avatarUrl: otherUser.avatar_url as string | undefined,
        lastMessage: undefined,
        lastMessageAt: conn.updated_at || conn.created_at as string,
        unreadCount: 0,
        conversationId: "",
        presence: 'offline'
      };
    }

    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`*`)
      .eq('conversation_id', conversationId);

    if (messagesError) {
      throw messagesError;
    }
    messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    let lastMessage = messages[0] || undefined;
    let sharedKey: CryptoKey | null = null;
    try {
      sharedKey = await getSharedKeyForChat(userId, otherUser.id);
    } catch (e) {
      console.warn("Could not get shared key (recipient might not have keys setup yet). Messages will stay encrypted.", e);
      // We continue without a shared key
    }
    let decryptedContent = "";
    if (lastMessage?.iv === "unencrypted") {
      decryptedContent = lastMessage.content as string;
    } else if (sharedKey) {
      try {
        decryptedContent = await decryptMessage(
          {
            ciphertext: lastMessage.content as string,
            iv: lastMessage.iv as string
          },
          sharedKey
        );
      } catch (error) {
        console.error("Failed to decrypt message:", lastMessage.id, error);
        decryptedContent = "Error decrypting message";
      }
    }

    const unreadCount = messages.filter(
      msg => !msg.is_read && msg.receiver_id === userId
    ).length;

    return {
      id: otherUser.id as string,
      name: otherUser.full_name as string,
      username: otherUser.username as string,
      avatarUrl: otherUser.avatar_url as string | undefined,
      lastMessage: decryptedContent || undefined,
      lastMessageAt: lastMessage?.created_at || conn.updated_at || conn.created_at as string,
      unreadCount,
      conversationId: conversationId || "",
      presence: 'offline'
    };
  }));

  new_data.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

  return new_data;
}