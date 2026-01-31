import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getPresenceChannel, isUserOnline } from '@/lib/presence/service'

export function useUserPresence(username: string) {
    const [isOnline, setIsOnline] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        // Get or initialize the shared channel
        const channel = getPresenceChannel(supabase)

        const updateStatus = () => {
            // Check current status from the shared state
            const online = isUserOnline(username)
            setIsOnline(online)
        }

        // Check immediately on mount
        updateStatus()

        // Listen for sync events on the shared channel
        channel.on('presence', { event: 'sync' }, updateStatus)

        return () => {
            // We don't unsubscribe or remove the channel here because 
            // one channel instance is shared across the entire app service.
            // We just let the component unmount and stop updating state.
        }
    }, [username])

    return isOnline
}
