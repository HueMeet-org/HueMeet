"use client";
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { setUserOffline, setUserOnline } from '@/lib/presence/service';
import { getUserProfileData } from '@/lib/profile/service';
import { useState } from 'react';
import { UserProfileComplete } from '@/types/user';
import { initializeUserKeys } from '@/lib/userKeyManager';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

export function PresenceTracker() {
  const [userData, setUserData] = useState<UserProfileComplete>();
  const supabase = createClient();

  useEffect(() => {
    async function fetchUserData() {
      try {
        const user = await getUserProfileData();
        setUserData(user);
        if (user?.id) {
          initializeUserKeys(user.id).catch(err => console.error("Key init failed:", err));
        }
      } catch (e) {
        // Not authenticated
      }
    }
    fetchUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const user = await getUserProfileData();
          setUserData(user);
          if (session.user.id) {
            initializeUserKeys(session.user.id).catch(err => console.error("Key init failed:", err));
          }
        } catch (e) { console.error(e) }
      } else if (event === 'SIGNED_OUT') {
        setUserData(undefined);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userData) return

    // Set user online when component mounts
    setUserOnline(supabase, userData.username)

    // Set user offline when component unmounts or page closes
    return () => {
      setUserOffline(supabase);
    }
  }, [userData, supabase])

  return null;
}