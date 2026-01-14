import { createClient } from '@/lib/supabase/client'

export type ProfileData = {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  aura: number | 0
}


