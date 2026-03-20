import { createClient } from '@/lib/supabase/client'
import { UserProfileComplete } from '@/types/user';

export interface Interest {
  id: string;
  name: string;
  category: string;
}

export async function getRecommendedUsers(): Promise<UserProfileComplete[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('get_recommended_users', {
    current_user_id: user.id,
  });

  if (error) throw error;

  return (data ?? []).map((u: any) => ({
    id: u.id,
    username: u.username,
    fullName: u.full_name,
    imageUrl: u.avatar_url ?? '',
    bio: u.bio ?? '',
    aura: u.aura,
    interests_count: u.shared_interests_count,
    connections_count: 0,
  }));
}

export async function getUserProfileData(): Promise<UserProfileComplete> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_profiles_complete')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;

  return data;
}

// Fetch any profile by username (for profile page)
export async function getProfileByUsername(username: string): Promise<UserProfileComplete | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('user_profiles_complete')
    .select('*')
    .eq('username', username)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return {
    id: data.id,
    username: data.username,
    fullName: data.full_name,
    imageUrl: data.avatar_url ?? '',
    bio: data.bio ?? '',
    aura: data.aura ?? 0,
    interests_count: data.interests_count ?? 0,
    connections_count: data.connections_count ?? 0,
  };
}

// Update the current user's profile info
export async function updateProfile(fields: { fullName?: string; bio?: string }): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('profiles')
    .update({
      ...(fields.fullName !== undefined && { full_name: fields.fullName }),
      ...(fields.bio !== undefined && { bio: fields.bio }),
    })
    .eq('id', user.id);

  if (error) throw error;
}

// Fetch the interest details for a given user
export async function getUserInterestsWithDetails(userId: string): Promise<Interest[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('user_interests')
    .select(`
      interest_id,
      interests (
        id,
        name,
        category
      )
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user interests:', error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.interests.id,
    name: row.interests.name,
    category: row.interests.category ?? 'Other',
  }));
}

// Fetch all available interests
export async function getAllInterests(): Promise<Interest[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('interests')
    .select('id, name, category')
    .order('category')
    .order('name');

  if (error) {
    console.error('Error fetching all interests:', error);
    return [];
  }

  return (data ?? []).map((i: any) => ({
    id: i.id,
    name: i.name,
    category: i.category ?? 'Other',
  }));
}

// Save updated interests for the current user (replace all)
export async function saveUserInterests(userId: string, interestIds: string[]): Promise<void> {
  const supabase = createClient();

  const { error: deleteError } = await supabase
    .from('user_interests')
    .delete()
    .eq('user_id', userId);

  if (deleteError) throw deleteError;

  if (interestIds.length === 0) return;

  const { error: insertError } = await supabase
    .from('user_interests')
    .insert(interestIds.map((id) => ({ user_id: userId, interest_id: id })));

  if (insertError) throw insertError;
}

export async function updateProfileAuraScore(auraScore: number): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const old_aura_score = await getUserProfileData().then((data) => data.aura);

  const { error } = await supabase
    .from('user_profiles_complete')
    .update({ aura: old_aura_score + auraScore })
    .eq('id', user.id);

  if (error) throw error;
}
