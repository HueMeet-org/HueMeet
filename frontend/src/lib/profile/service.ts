import { createClient } from '@/lib/supabase/client'
import { UserProfileComplete } from '@/types/user';

export async function getUserProfileData(): Promise<UserProfileComplete> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from("user_profiles_complete")
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    throw error
  }

  return data;
}


