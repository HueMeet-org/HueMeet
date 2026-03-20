"use client";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader } from './ui/card'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client';
import { Sparkles, Users } from 'lucide-react';
import { UserProfileComplete } from '@/types/user';

export const UserHomeCard = () => {
    const [userData, setUserData] = useState<UserProfileComplete | null>(null);
    const supabase = createClient()

    const getUserData = useCallback(async () => {
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
        const id = user.id
        const username = data.username as string
        const fullName = (data.full_name as string | null) ?? ''
        const bio = (data.bio as string | null) ?? ''
        const aura = (data.aura as number | null) ?? 0
        const interests_count = data.interests_count as number
        const connections_count = data.connections_count as number

        let imageUrl = (data.avatar_url as string | null) ?? ''

        if (!imageUrl) {
            imageUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || '/globe.svg';
        }

        return { id, imageUrl, username, fullName, bio, interests_count, connections_count, aura }
    }, [supabase])

    useEffect(() => {
        const fetchUser = async () => {
            const data = await getUserData();
            if (data) {
                setUserData(data);
            }
        };

        fetchUser();
    }, [getUserData]);
    return (
        <Card className='w-full border  bg-card/50 backdrop-blur-sm'>
            <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                    <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-primary/10">
                        <AvatarImage src={userData?.imageUrl} alt={userData?.username} />
                        <AvatarFallback className="bg-primary/10 text-lg sm:text-xl font-semibold">
                            {userData?.fullName?.charAt(0) || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 w-full">
                        <h3 className="text-xl sm:text-2xl font-bold leading-tight truncate">
                            {userData?.fullName || 'Loading...'}
                        </h3>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            @{userData?.username || 'username'}
                        </p>
                        {userData?.bio && (
                            <p className="text-sm text-muted-foreground/80 mt-2 line-clamp-2">
                                {userData.bio}
                            </p>
                        )}
                    </div>
                </div>
            </CardHeader>
            
            <CardContent className="pt-0 pb-4">
                <div className="flex flex-col md:flex-row items-start md:justify-start gap-3 md:gap-6">
                    <div className="w-full md:shrink-0 flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-accent border-accent border" style={{ width: 'clamp(180px, 18vw, 260px)' }}>
                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-yellow-400/20">
                            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-accent-foreground dark:text-accent-foreground" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">Aura</p>
                            <p className="text-lg sm:text-xl font-bold truncate">{userData?.aura?.toLocaleString() || '0'}</p>
                        </div>
                    </div>
                    
                    <div className="w-full md:shrink-0 flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-blue-500/10 border border-blue-500/20" style={{ width: 'clamp(180px, 18vw, 260px)' }}>
                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-blue-500/20">
                            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">Connections</p>
                            <p className="text-lg sm:text-xl font-bold truncate">{userData?.connections_count?.toLocaleString() || '0'}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
