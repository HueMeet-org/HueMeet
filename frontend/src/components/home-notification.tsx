"use client"
import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Item, ItemContent, ItemDescription, ItemTitle } from './ui/item'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import Link from 'next/link'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from './ui/empty'
import { Skeleton } from './ui/skeleton'
import { Notification } from '@/types/notification'

export const notificationsMock: Notification[] = [
  {
    id: "n_1",
    type: "missed_call",
    title: "Missed Call",
    description: "You missed a video call from Rohan Mehta",
    imageUrl: "https://i.pravatar.cc/150?img=45",
    createdAt: "5 mins ago",
    isRead: false,
  },
  {
    id: "n_2",
    type: "unread_message",
    title: "New Message",
    description: "Aarav Sharma: 'Are we still on for the meeting?'",
    imageUrl: "https://i.pravatar.cc/150?img=11",
    createdAt: "12 mins ago",
    isRead: false,
  },
  {
    id: "n_3",
    type: "aura_update",
    title: "Aura Level Up!",
    description: "Your aura increased to 105. Keep interacting!",
    imageUrl: "/aura-icon.png", // Or a specific aura graphic
    createdAt: "1 hour ago",
    isRead: true,
  },
  {
    id: "n_4",
    type: "alert",
    title: "Security Alert",
    description: "New login detected from a Chrome browser on Windows.",
    imageUrl: "https://cdn-icons-png.flaticon.com/512/564/564619.png",
    createdAt: "Yesterday",
    isRead: true,
  },
]

export const HomeNotification = () => {
  const [notifications, setNotifications] = useState<Notification[]>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setNotifications(notificationsMock);
    setLoading(false);
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className='space-y-4'>
          {[...Array(4).keys()].map((data) => (
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

  if (!notifications || notifications.length === 0) {
    return (
      <Card>
        <CardContent>
          <Empty>
            <EmptyHeader>
              <EmptyTitle>All clear</EmptyTitle>
              <EmptyDescription>No new alerts or messages</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link href={'/'}><Button className='cursor-pointer'>Return Home</Button></Link>
            </EmptyContent>
          </Empty>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col m-0 p-0 gap-0">
      <CardHeader className="py-4 px-4">
        <CardTitle className="text-base sm:text-lg">Notifications</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 px-0  mx-2 py-0 gap-0">
        {notifications.map((notif) => (
          <Item 
            className={`cursor-pointer hover:bg-muted mb-3 gap-0 p-0 rounded-lg transition-colors ${
              !notif.isRead ? 'bg-muted/50 ' : ''
            }`} 
            key={notif.id}
          >
            <ItemContent className="p-3">
              <Link href={'/'} >
                <div className='w-full flex items-center gap-3'>
                  <div className="flex-shrink-0">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                      <AvatarImage src={notif.imageUrl} />
                      <AvatarFallback>{notif.title[0]}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 p-0">
                    <ItemTitle className={`truncate text-sm sm:text-base ${
                      !notif.isRead ? "font-bold" : ""
                    }`}>
                        {notif.title}
                    </ItemTitle>
                    <ItemDescription className="line-clamp-1 text-xs sm:text-xs">{notif.description}</ItemDescription>
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