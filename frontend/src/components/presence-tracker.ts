"use client";
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { setUserOffline, setUserOnline } from '@/lib/presence/service'
import { getUserProfileData } from '@/lib/profile/service'
import { useState } from 'react'
import { UserProfileComplete } from '@/types/user';

export function PresenceTracker() {
  const [userData, setUserData] = useState<UserProfileComplete>();
  const supabase = createClient();

  useEffect(() => {
    async function fetchUserData() {
      const user = await getUserProfileData();
      setUserData(user);
    }
    fetchUserData();
  }, []);

  useEffect(() => {
    if (!userData) return

    // Set user online when component mounts
    setUserOnline(supabase, userData.username)

    // Set user offline when component unmounts or page closes
    return () => {
      console.log("I'm offline")
      setUserOffline(supabase)
    }
  }, [userData, supabase])

  return null;
}