"use client"
import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { ConnectedUsers } from '@/types/user'
import { Button } from './ui/button'
import { Item, ItemContent, ItemDescription, ItemTitle } from './ui/item'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import Link from 'next/link'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from './ui/empty'
import { Skeleton } from './ui/skeleton'
import { cn } from '@/lib/utils'
import { getActiveConnections } from '@/lib/connections/service'
import { createClient } from '@/lib/supabase/client'
import { useUserPresence } from '@/hooks/use-presence'

export const HomeConnections = () => {
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
      <Card>
        <CardContent className='space-y-4'>
          {[...Array(5).keys()].map((data) => (
            <div key={data} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-62.5" />
                <Skeleton className="h-4 w-50" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (!connections) {
    return (
      <Card>
        <CardContent>
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No Connections</EmptyTitle>
              <EmptyDescription>No connected users found</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link href={'/discover'}><Button className='cursor-pointer'>Make Connections</Button></Link>
            </EmptyContent>
          </Empty>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col m-0 p-0 gap-0">
      <CardHeader className="py-4 px-4">
        <CardTitle className="text-base sm:text-lg">Active Connections</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 px-0  mx-2 py-0 gap-0">
        {!loading && connections.map((user) => (
          <ConnectionItem key={user.id} user={user} />
        ))}
      </CardContent>
    </Card>
  )
}

function ConnectionItem({ user }: { user: ConnectedUsers }) {
  const isOnline = useUserPresence(user.username)
  // Fallback to offline if hook returns false, or 'online' if true.
  // We explicitly cast to match the union type expected if we were using strict types.
  const presence = (isOnline ? 'online' : 'offline') as ConnectedUsers['presence']

  return (
    <Item className='cursor-pointer gap-0 p-0 hover:bg-muted rounded-lg transition-colors'>
      <ItemContent className="p-3">
        <Link href={`/profile/${user.username}`} >
          <div className='w-full flex items-center gap-3'>
            <div className="relative shrink-0">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                <AvatarImage src={user.avatarUrl} />
                <AvatarFallback>{user.name[0]}</AvatarFallback>
              </Avatar>

              {/* Notification Notch */}
              {user.unreadCount > 0 && <span className='absolute -bottom-1 -right-1 bg-red-600 rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-bold text-white border-2 border-background'>{user.unreadCount > 99 ? '99+' : user.unreadCount}</span>}

              {/* Status Indicator Notch */}
              <span className={
                cn('absolute -top-0.5 -left-0.5 block h-3 w-3 rounded-full border-2 border-background',
                  presence === 'online' ? 'bg-green-500' :
                    presence === 'away' ? 'bg-yellow-500' :
                      presence === 'offline' ? 'bg-slate-400' :
                        presence === 'typing' ? 'bg-green-500 animate-pulse' : 'hidden'
                )}
              />

              {presence === 'typing' && (
                <span className="absolute -top-0.5 -left-0.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-background"></span>
                </span>
              )}
            </div>
            <div className="flex-1 p-0">
              <ItemTitle className="truncate text-sm sm:text-base">{user.name}</ItemTitle>
              <ItemDescription className="truncate text-xs sm:text-xs">{user.lastMessage}</ItemDescription>
            </div>
          </div>
        </Link>
      </ItemContent>
    </Item>
  )
}
