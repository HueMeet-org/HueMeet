"use client";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client';
import UserProfileComplete from '@/types/user-complete';
import { Sparkles, Users } from 'lucide-react';

export const UserHomeCard = () => {
    const [userData, setUserData] = useState<UserProfileComplete | null>(null);
    const supabase = createClient()

    const getUserData = async () => {
        const { data: { user } } = await supabase.auth.getUser()

        // If no user is logged in at all, stop here
        if (!user) return null;

        const { data, error } = await supabase
            .from("user_profiles_complete")
            .select('*')
            .eq('id', user.id)
            .single()

        if (error) {
            console.error('Error fetching user data:', error)
            return null
        }

        // Get values from the profile table
        const username = data.username
        const fullName = data.full_name
        const bio = data.bio
        const aura = data.aura
        const interests_count = data.interests_count
        const connections_count = data.connections_count


        let imageUrl = data.avatar_url

        if (!imageUrl) {
            imageUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || '/globe.svg';
        }

        return { imageUrl, username, fullName, bio, interests_count, connections_count, aura }
    }

    useEffect(() => {
        const fetchUser = async () => {
            const data = await getUserData();
            if (data) {
                setUserData(data);
            }
        };

        fetchUser();
    }, []);
    return (
        <Card className='w-full border-border/40 bg-card/50 backdrop-blur-sm'>
            <CardHeader className="pb-3">
                <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14 border-2 border-primary/10">
                        <AvatarImage src={userData?.imageUrl} alt={userData?.username} />
                        <AvatarFallback className="bg-primary/10 text-base font-semibold">
                            {userData?.fullName?.charAt(0) || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold leading-tight truncate">
                            {userData?.fullName || 'Loading...'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            @{userData?.username || 'username'}
                        </p>
                    </div>
                </div>
                {userData?.bio && (
                    <p className="text-sm text-muted-foreground/80 mt-1 line-clamp-2">
                        {userData.bio}
                    </p>
                )}
            </CardHeader>
            
            <CardContent className="pt-0 pb-4">
                <div className="flex gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-accent border-accent flex-1">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full grayscale">
                            <Sparkles className="h-4 w-4 text-accent-foreground dark:text-accent-foreground" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Aura</p>
                            <p className="text-base font-semibold">{userData?.aura?.toLocaleString() || '0'}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-blue-500/10 border border-blue-500/20 flex-1">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20">
                            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Connections</p>
                            <p className="text-base font-semibold">{userData?.connections_count?.toLocaleString() || '0'}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
