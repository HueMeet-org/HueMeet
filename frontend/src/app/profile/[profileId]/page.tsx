"use client";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { UserProfileComplete } from '@/types/user';
import { createClient } from '@/lib/supabase/client';
import { PencilIcon, CheckIcon, XIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  getProfileByUsername,
  updateProfile,
  getUserInterestsWithDetails,
  getAllInterests,
  saveUserInterests,
  Interest,
} from '@/lib/profile/service';

interface ProfilePageProps {
  params: Promise<{ profileId: string }>
}

export default function Profile({ params }: ProfilePageProps) {
  const [userData, setUserData] = useState<UserProfileComplete | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  // Avatar editing
  const [isHoveringAvatar, setIsHoveringAvatar] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Profile info editing
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<{ fullName: string; bio: string }>({ fullName: '', bio: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Interests
  const [userInterests, setUserInterests] = useState<Interest[]>([]);
  const [allInterests, setAllInterests] = useState<Interest[]>([]);
  const [isEditingInterests, setIsEditingInterests] = useState(false);
  const [tempInterestIds, setTempInterestIds] = useState<Set<string>>(new Set());
  const [isSavingInterests, setIsSavingInterests] = useState(false);

  const supabase = createClient();
  const profile = React.use(params);
  const profileId = profile.profileId;

  useEffect(() => {
    if (!profileId) return;

    const load = async () => {
      setLoading(true);
      try {
        // Get current logged-in user
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id ?? null);

        // Fetch the viewed profile
        const profileData = await getProfileByUsername(profileId);
        if (!profileData) {
          setLoading(false);
          return;
        }
        setUserData(profileData);

        // Check ownership
        const owner = user?.id === profileData.id;
        setIsOwner(owner);

        // Fetch this user's interests
        const interests = await getUserInterestsWithDetails(profileData.id);
        setUserInterests(interests);

        // If owner, also fetch all interests for editing
        if (owner) {
          const all = await getAllInterests();
          setAllInterests(all);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [profileId]);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userData) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setUserData({ ...userData, imageUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
    // TODO: Upload to Supabase Storage as right now supa
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setIsEditing(false);
    } else {
      setEditedData({ fullName: userData?.fullName ?? '', bio: userData?.bio ?? '' });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!userData) return;
    setIsSaving(true);
    try {
      await updateProfile({ fullName: editedData.fullName, bio: editedData.bio });
      setUserData({ ...userData, fullName: editedData.fullName, bio: editedData.bio });
      setIsEditing(false);
      toast.success('Profile updated!');
    } catch (err) {
      console.error('Failed to save profile:', err);
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInterestsEditToggle = () => {
    if (isEditingInterests) {
      setIsEditingInterests(false);
    } else {
      setTempInterestIds(new Set(userInterests.map((i) => i.id)));
      setIsEditingInterests(true);
    }
  };

  const toggleInterest = (id: string) => {
    setTempInterestIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleInterestsSave = async () => {
    if (!userData || !currentUserId) return;
    setIsSavingInterests(true);
    try {
      await saveUserInterests(currentUserId, Array.from(tempInterestIds));
      const updated = allInterests.filter((i) => tempInterestIds.has(i.id));
      setUserInterests(updated);
      setIsEditingInterests(false);
      toast.success('Interests saved!');
    } catch (err) {
      console.error('Failed to save interests:', err);
      toast.error('Failed to save interests');
    } finally {
      setIsSavingInterests(false);
    }
  };

  const displayInterests = isEditingInterests ? allInterests : userInterests;
  const interestsByCategory = displayInterests.reduce((acc, interest) => {
    const cat = interest.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(interest);
    return acc;
  }, {} as Record<string, Interest[]>);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <Card className="p-0">
          <div className="relative w-full bg-accent" style={{ aspectRatio: '4/1' }} />
          <CardContent className="relative pt-16 sm:pt-20 md:pt-24 px-6 sm:px-8 md:px-12 pb-8 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full max-w-lg" />
            <Skeleton className="h-4 w-3/4 max-w-lg" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-8 px-6 pb-8 space-y-3">
            <Skeleton className="h-6 w-32" />
            <div className="flex gap-2 flex-wrap">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-7 w-20 rounded-full" />)}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="w-full max-w-4xl mx-auto text-center py-20 text-muted-foreground">
        Profile not found.
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className='p-0'>
        {/* Banner */}
        <div className="relative w-full bg-accent" style={{ aspectRatio: '4/1' }}>
          {/* Avatar */}
          <div
            className="absolute left-6 sm:left-8 md:left-12 bottom-0 translate-y-1/2 group"
            onMouseEnter={() => setIsHoveringAvatar(true)}
            onMouseLeave={() => setIsHoveringAvatar(false)}
          >
            <div className="relative">
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32 md:h-36 md:w-36 border-4 border-card shadow-xl ring-2 ring-primary/10">
                <AvatarImage src={userData.imageUrl} alt={userData.fullName} />
                <AvatarFallback className="bg-primary/10 text-2xl sm:text-3xl md:text-4xl font-bold">
                  {userData.fullName.charAt(0)}
                </AvatarFallback>
              </Avatar>

              {isOwner && (
                <div
                  className={`absolute inset-0 rounded-full flex items-center justify-center bg-black/50 cursor-pointer transition-opacity duration-200 ${isHoveringAvatar ? 'opacity-100' : 'opacity-0'}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <PencilIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
          </div>
        </div>

        <CardContent className="relative pt-16 sm:pt-20 md:pt-24 px-6 sm:px-8 md:px-12 pb-8">
          {/* Edit / Save / Cancel buttons */}
          {isOwner && (
            <div className="absolute top-4 right-5 flex gap-2">
              {isEditing ? (
                <>
                  <CheckIcon
                    className={`w-5 h-5 text-green-500 cursor-pointer hover:text-green-600 transition-colors ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}
                    onClick={handleSave}
                  />
                  <XIcon
                    className="w-5 h-5 text-red-500 cursor-pointer hover:text-red-600 transition-colors"
                    onClick={handleEditToggle}
                  />
                </>
              ) : (
                <PencilIcon
                  className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
                  onClick={handleEditToggle}
                />
              )}
            </div>
          )}

          {/* Name & Username */}
          <div className="mb-4">
            {isEditing ? (
              <div className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={editedData.fullName}
                    onChange={(e) => setEditedData({ ...editedData, fullName: e.target.value })}
                    className="text-lg font-semibold"
                  />
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1">
                  {userData.fullName}{' '}
                  {isOwner && <span className="text-sm font-medium text-primary/80">(You)</span>}
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground">@{userData.username}</p>
              </>
            )}
          </div>

          {/* Bio */}
          <div className="mb-6">
            {isEditing ? (
              <div className="space-y-1.5 max-w-2xl">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={editedData.bio}
                  onChange={(e) => setEditedData({ ...editedData, bio: e.target.value })}
                  className="min-h-25 resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>
            ) : (
              <p className="text-sm sm:text-base text-foreground/80 leading-relaxed max-w-2xl">
                {userData.bio || <span className="text-muted-foreground italic">No bio yet.</span>}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="font-bold flex gap-4">
            <span>
              {isOwner ? (
                <Link className="mb-6 text-blue-400 hover:text-blue-500 transition-colors" href="/messages">
                  {userData.connections_count} connections
                </Link>
              ) : (
                <span>{userData.connections_count} connections</span>
              )}
            </span>
            <span>{userData.aura} Aura</span>
          </div>
        </CardContent>
      </Card>

      {/* Interests Card */}
      <Card className="mt-6">
        <CardContent className="relative pt-8 px-6 sm:px-8 md:px-12 pb-8">
          {isOwner && (
            <div className="absolute top-4 right-5 flex gap-2">
              {isEditingInterests ? (
                <XIcon
                  className="w-5 h-5 text-red-500 cursor-pointer hover:text-red-600 transition-colors"
                  onClick={handleInterestsEditToggle}
                />
              ) : (
                <PencilIcon
                  className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
                  onClick={handleInterestsEditToggle}
                />
              )}
            </div>
          )}

          <h2 className="text-xl font-bold mb-6">Interests</h2>

          <div className="space-y-6">
            {Object.keys(interestsByCategory).length > 0 ? (
              Object.entries(interestsByCategory).map(([category, interests]) => (
                <div key={category}>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {category}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {interests.map((interest) => (
                      <Badge
                        key={interest.id}
                        variant={
                          isEditingInterests
                            ? tempInterestIds.has(interest.id) ? 'default' : 'outline'
                            : 'default'
                        }
                        className={`px-3 py-1.5 text-sm transition-all ${isEditingInterests ? 'cursor-pointer hover:scale-105' : ''}`}
                        onClick={() => isEditingInterests && toggleInterest(interest.id)}
                      >
                        {interest.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                {isEditingInterests ? 'Loading interests...' : 'No interests selected.'}
              </p>
            )}
          </div>

          {isEditingInterests && (
            <>
              <Separator className="my-6" />
              <Button
                onClick={handleInterestsSave}
                size="lg"
                className="w-full cursor-pointer"
                disabled={isSavingInterests}
              >
                {isSavingInterests ? 'Saving...' : 'Save Interests'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
