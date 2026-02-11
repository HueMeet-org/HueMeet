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

interface ProfilePageProps {
  params: Promise<{ profileId: string }>
}

interface Interest {
  id: string;
  name: string;
  category: string;
}

const dummyAllInterests: Interest[] = [
  { id: '1', name: 'Programming', category: 'Technology' },
  { id: '2', name: 'Design', category: 'Art' },
  { id: '3', name: 'AI', category: 'Technology' },
  { id: '4', name: 'Photography', category: 'Art' },
  { id: '5', name: 'Music', category: 'Entertainment' },
  { id: '6', name: 'Gaming', category: 'Entertainment' },
];

// false user data
const fakeUserData: UserProfileComplete = {
  imageUrl: "https://picsum.photos/200",
  coverUrl: "",
  fullName: "John Doe",
  username: "johndoe",
  bio: "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Enim, totam dolorem corporis deleniti eaque id eligendi architecto natus ullam repudiandae. Minima optio quasi numquam quibusdam odio veritatis consectetur, exercitationem ipsa.",
  connections_count: 124,
  aura: 75,
  interests_count: 34
};

export default function Profile({ params }: ProfilePageProps) {
  const [userData, setUserData] = useState<UserProfileComplete | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isHoveringAvatar, setIsHoveringAvatar] = useState(false);
  const [isHoveringBanner, setIsHoveringBanner] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingInterests, setIsEditingInterests] = useState(false);
  const [editedData, setEditedData] = useState<Partial<UserProfileComplete>>({});
  const [userInterests, setUserInterests] = useState<Set<string>>(new Set(['1', '3', '5'])); // Dummy selected interests
  const [tempInterests, setTempInterests] = useState<Set<string>>(new Set());
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const coverInputRef = React.useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const profile = React.use(params);
  const profileId = profile.profileId;

  useEffect(() => {
    if (!profileId) return;
    const loadOwnerUserName = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: onwerUserName, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user?.id)
        .single();

      if (onwerUserName && onwerUserName.username === profileId) {
        setIsOwner(true);
      } else {
        setIsOwner(false);
      }
    };

    loadOwnerUserName();
    // loading fake data for now
    setUserData(fakeUserData);
  }, [profileId, supabase]);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Note: For preview purposes only, we read the file locally.
    const reader = new FileReader();
    reader.onloadend = () => {
      if (userData) {
        setUserData({
          ...userData,
          imageUrl: reader.result as string
        });
      }
    };
    reader.readAsDataURL(file);

    // TODO: Upload the image to Supabase Storage
  };

    const handleCoverChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        if (userData) {
          setUserData({
            ...userData,
            // set preview cover URL
            coverUrl: reader.result as string
          });
        }
      };
      reader.readAsDataURL(file);

      // TODO: Upload the cover image to Supabase Storage and update profile
    };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset editedData
      setEditedData({});
      setIsEditing(false);
    } else {
      // Start editing - initialize editedData with current userData
      setEditedData({
        fullName: userData?.fullName,
        username: userData?.username,
        bio: userData?.bio
      });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!userData) return;

    // Update local state
    setUserData({
      ...userData,
      fullName: editedData.fullName || userData.fullName,
      username: editedData.username || userData.username,
      bio: editedData.bio || userData.bio
    });

    // TODO: Save to Supabase

    setIsEditing(false);
    setEditedData({});
  };

  const handleInterestsEditToggle = () => {
    if (isEditingInterests) {
      setIsEditingInterests(false);
      setTempInterests(new Set());
    } else {
      setTempInterests(new Set(userInterests));
      setIsEditingInterests(true);
    }
  };

  const toggleInterest = (interestId: string) => {
    setTempInterests(prev => {
      const next = new Set(prev);
      if (next.has(interestId)) {
        next.delete(interestId);
      } else {
        next.add(interestId);
      }
      return next;
    });
  };

  const handleInterestsSave = () => {
    setUserInterests(new Set(tempInterests));
    setIsEditingInterests(false);
  };

  const interestsByCategory = (isEditingInterests ? dummyAllInterests : dummyAllInterests.filter(i => userInterests.has(i.id)))
    .reduce((acc, interest) => {
      const category = interest.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(interest);
      return acc;
    }, {} as Record<string, Interest[]>);

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className='p-0'>
        {/* Banner - 4:1 aspect ratio */}
        <div
          className="relative w-full bg-accent"
          style={{
            aspectRatio: '4/1',
            backgroundImage: userData?.coverUrl ? `url('${userData.coverUrl}')` : undefined,
            backgroundSize: userData?.coverUrl ? 'cover' : undefined,
            backgroundPosition: userData?.coverUrl ? 'center' : undefined,
          }}
          onMouseEnter={() => setIsHoveringBanner(true)}
          onMouseLeave={() => setIsHoveringBanner(false)}
        >
          {/* Cover edit overlay - only shows for owner */}
          {isOwner && (
            <div
              className={`absolute right-4 top-4 rounded-md p-1 bg-black/40 text-white cursor-pointer transition-opacity duration-200 ${isHoveringBanner ? 'opacity-100' : 'opacity-0'}`}
              onClick={() => coverInputRef.current?.click()}
            >
              <PencilIcon className="w-5 h-5" />
            </div>
          )}

          {/* Hidden cover file input */}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverChange}
          />

          {/* Profile Photo - Positioned half in/out of banner */}
          <div
            className="absolute left-6 sm:left-8 md:left-12 bottom-0 translate-y-1/2 group"
            onMouseEnter={() => setIsHoveringAvatar(true)}
            onMouseLeave={() => setIsHoveringAvatar(false)}
          >
            <div className="relative">
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32 md:h-36 md:w-36 border-4 border-card shadow-xl ring-2 ring-primary/10">
                <AvatarImage src={userData?.imageUrl} alt={userData?.fullName} />
                <AvatarFallback className="bg-primary/10 text-2xl sm:text-3xl md:text-4xl font-bold">
                  {userData?.fullName.charAt(0)}
                </AvatarFallback>
              </Avatar>

              {/* Edit overlay - only shows on hover if owner */}
              {isOwner && (
                <div
                  className={`absolute inset-0 rounded-full flex items-center justify-center bg-black/50 cursor-pointer transition-opacity duration-200 ${isHoveringAvatar ? 'opacity-100' : 'opacity-0'
                    }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <PencilIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
              )}

              {/* Hidden file input */}
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
          {isOwner && (
            <div className="absolute top-4 right-5 flex gap-2">
              {isEditing ? (
                <>
                  <CheckIcon
                    className="w-5 h-5 text-green-500 cursor-pointer hover:text-green-600 transition-colors"
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
          {/* Name and Username */}
          <div className="mb-4">
            {isEditing ? (
              <div className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={editedData.fullName || ''}
                    onChange={(e) => setEditedData({ ...editedData, fullName: e.target.value })}
                    className="text-lg font-semibold"
                  />
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1">
                  {userData?.fullName} {isOwner && <span className="text-sm font-medium text-primary/80">(You)</span>}
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground">
                  @{userData?.username}
                </p>
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
                  value={editedData.bio || ''}
                  onChange={(e) => setEditedData({ ...editedData, bio: e.target.value })}
                  className="min-h-25 resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>
            ) : (
              <p className="text-sm sm:text-base text-foreground/80 leading-relaxed max-w-2xl">
                {userData?.bio}
              </p>
            )}
          </div>

          {/* Connections Count */}
          <div className="font-bold flex gap-4">
            <span>{isOwner ? (
              <Link className='mb-6 text-blue-400 hover:text-blue-500 transition-colors' href={'/messages'}>{userData?.connections_count} connections</Link>
            ) : (
              <span>{userData?.connections_count} connections</span>
            )}
            </span>
            <span>{userData?.aura} Aura</span>
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
                    {interests.map(interest => (
                      <Badge
                        key={interest.id}
                        variant={(isEditingInterests ? tempInterests : userInterests).has(interest.id) ? "default" : "outline"}
                        className={`${isEditingInterests ? 'cursor-pointer' : ''} px-3 py-1.5 text-sm transition-all ${isEditingInterests ? 'hover:scale-105' : ''}`}
                        onClick={() => isEditingInterests && toggleInterest(interest.id)}
                      >
                        {interest.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No interests selected.</p>
            )}
          </div>

          {isEditingInterests && (
            <>
              <Separator className="my-6" />
              <div className="flex flex-col gap-4">
                <Button
                  onClick={handleInterestsSave}
                  size="lg"
                  className="w-full cursor-pointer"
                >
                  Save Interests
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
