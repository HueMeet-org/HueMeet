"use client"
import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConnectedUsers } from '@/types/user'
import { Button } from '@/components/ui/button'
import { Item, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { getActiveConnections } from '@/lib/connections/service'
import { createClient } from '@/lib/supabase/client'
import { useUserPresence } from '@/hooks/use-presence'

export default function Messages() {
    const [connections, setConnections] = useState<ConnectedUsers[]>();
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const getActiveConnectionsData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const connectedUsers = await getActiveConnections(user.id);
                setConnections(connectedUsers);
                setLoading(false);
            }
        }

        getActiveConnectionsData();
    }, [])

    if (loading) {
        return (
            <Card className="h-[85vh]">
                <CardHeader className="py-4 px-4 border-b">
                    <CardTitle className="text-xl">Messages</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4 p-4'>
                    {[...Array(8).keys()].map((data) => (
                        <div key={data} className="flex items-center space-x-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-1/3" />
                                <Skeleton className="h-4 w-2/3" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        )
    }

    if (!connections || connections.length === 0) {
        return (
            <Card className="h-[85vh]">
                <CardHeader className="py-4 px-4 border-b">
                    <CardTitle className="text-xl">Messages</CardTitle>
                </CardHeader>
                <CardContent className="h-full flex items-center justify-center">
                    <Empty>
                        <EmptyHeader>
                            <EmptyTitle>No Connections</EmptyTitle>
                            <EmptyDescription>You haven't connected with anyone yet.</EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                            <Link href={'/discover'}><Button className='cursor-pointer'>Find People</Button></Link>
                        </EmptyContent>
                    </Empty>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="h-[85vh] flex flex-col m-0 p-0 gap-0 overflow-hidden">
            <CardHeader className="py-4 px-4 border-b shrink-0">
                <CardTitle className="text-xl">Messages</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 px-0 mx-0 py-0 gap-0 overflow-y-auto custom-scrollbar">
                {connections.map((user) => (
                    <ConnectionItem key={user.id} user={user} />
                ))}
            </CardContent>
        </Card>
    )
}

function ConnectionItem({ user }: { user: ConnectedUsers }) {
    const isOnline = useUserPresence(user.username)
    const presence = (isOnline ? 'online' : 'offline') as ConnectedUsers['presence']

    return (
        <Item className='cursor-pointer gap-0 p-0 hover:bg-muted/50 border-b last:border-0 rounded-none transition-colors'>
            <ItemContent className="p-4">
                <Link href={`/messages/${user.conversationId}`} className="block w-full">
                    <div className='w-full flex items-center gap-4'>
                        <div className="relative shrink-0">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={user.avatarUrl} />
                                <AvatarFallback>{user.name[0]}</AvatarFallback>
                            </Avatar>

                            {/* Notification Notch */}
                            {user.unreadCount > 0 && (
                                <span className='absolute -bottom-1 -right-1 bg-red-600 rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-bold text-white border-2 border-background'>
                                    {user.unreadCount > 99 ? '99+' : user.unreadCount}
                                </span>
                            )}

                            {/* Status Indicator Notch */}
                            <span className={cn(
                                'absolute -top-0.5 -left-0.5 block h-3.5 w-3.5 rounded-full border-2 border-background',
                                presence === 'online' ? 'bg-green-500' :
                                    presence === 'away' ? 'bg-yellow-500' :
                                        presence === 'offline' ? 'bg-slate-400' :
                                            presence === 'typing' ? 'bg-green-500 animate-pulse' : 'hidden'
                            )} />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                                <ItemTitle className="truncate font-semibold text-base">{user.name}</ItemTitle>
                                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                    {formatTime(user.lastMessageAt)}
                                </span>
                            </div>
                            <ItemDescription className="truncate text-sm text-muted-foreground">
                                {user.lastMessage || "Start a conversation"}
                            </ItemDescription>
                        </div>
                    </div>
                </Link>
            </ItemContent>
        </Item>
    )
}

function formatTime(dateString: string) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
        return 'Yesterday';
    } else if (days < 7) {
        return date.toLocaleDateString([], { weekday: 'short' });
    } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
}

