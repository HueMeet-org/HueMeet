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

export const recentConnectionsMock: ConnectedUsers[] = [
  {
    id: "rc_1",
    userId: "u_101",
    name: "Aarav Sharma",
    username: "aarav_s",
    avatarUrl: "https://i.pravatar.cc/150?img=11",
    lastMessage: "Did you check the docs I sent?",
    lastMessageAt: "2026-01-20T08:42:00Z",
    unreadCount: 2,
    presence: "online",
  },
  {
    id: "rc_2",
    userId: "u_102",
    name: "Neha Verma",
    username: "neha_v",
    avatarUrl: "https://i.pravatar.cc/150?img=32",
    lastMessage: "Okay, sounds good 👍",
    lastMessageAt: "2026-01-20T07:58:00Z",
    unreadCount: 0,
    presence: "away",
  },
  {
    id: "rc_3",
    userId: "u_103",
    name: "Rohan Mehta",
    username: "rohan_m",
    avatarUrl: "https://i.pravatar.cc/150?img=45",
    lastMessage: "Let’s sync after lunch",
    lastMessageAt: "2026-01-19T18:21:00Z",
    unreadCount: 62,
    presence: "typing",
  },
  {
    id: "rc_4",
    userId: "u_104",
    name: "Priya Singh",
    username: "priya_s",
    avatarUrl: "https://i.pravatar.cc/150?img=28",
    lastMessage: "Thanks! That helped a lot",
    lastMessageAt: "2026-01-19T16:05:00Z",
    unreadCount: 0,
    presence: "offline",
  },
  {
    id: "rc_5",
    userId: "u_105",
    name: "Kunal Patel",
    username: "kunal_p",
    avatarUrl: "https://i.pravatar.cc/150?img=53",
    lastMessage: "Can we move this to tomorrow?",
    lastMessageAt: "2026-01-18T21:47:00Z",
    unreadCount: 4,
    presence: "online",
  },
]

export const HomeConnections = () => {
  const [connections, setConnections] = useState<ConnectedUsers[]>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setConnections(recentConnectionsMock);
    setLoading(false);
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
          <Item className='cursor-pointer gap-0 p-0 hover:bg-muted rounded-lg transition-colors' key={user.id}>
            <ItemContent className="p-3">
              <Link href={`/profile/${user.username}`} >
                <div className='w-full flex items-center gap-3'>
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>

                      {/* Notification Notch */}
                      {user.unreadCount > 0 && <span className='absolute -bottom-1 -right-1 bg-red-600 rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-bold text-white border-2 border-background'>{user.unreadCount > 99 ? '99+' : user.unreadCount}</span>}

                      {/* Status Indicator Notch */}
                      <span className={
                        cn('absolute -top-0.5 -left-0.5 block h-3 w-3 rounded-full border-2 border-background',
                          user.presence === 'online' ? 'bg-green-500' :
                          user.presence === 'away' ? 'bg-yellow-500' :
                          user.presence === 'offline' ? 'bg-slate-400' :
                          user.presence === 'typing' ? 'bg-green-500 animate-pulse' : 'hidden'
                        )}
                      />

                      {/* Optional: Typing Dot Animation Overlay */}
                      {user.presence === 'typing' && (
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
        ))}
      </CardContent>
    </Card>
  )
}
