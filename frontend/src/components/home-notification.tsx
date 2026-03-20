"use client"
import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Item, ItemContent, ItemDescription, ItemTitle } from './ui/item'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import Link from 'next/link'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from './ui/empty'
import { Skeleton } from './ui/skeleton'
import { getUnreadMessageNotifications, UnreadMessageNotification } from '@/lib/messages/service'

export const HomeNotification = () => {
  const [notifications, setNotifications] = useState<UnreadMessageNotification[]>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUnreadMessageNotifications()
      .then(setNotifications)
      .catch((err) => {
        console.error('Failed to fetch notifications:', err);
        setNotifications([]);
      })
      .finally(() => setLoading(false));
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
              <EmptyDescription>No new messages</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link href={'/messages'}><Button className='cursor-pointer'>Go to Messages</Button></Link>
            </EmptyContent>
          </Empty>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col m-0 p-0 gap-0">
      <CardHeader className="py-4 px-4">
        <CardTitle className="text-base sm:text-lg">
          Notifications
          <span className="ml-2 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold h-5 min-w-5 px-1.5">
            {notifications.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 px-0 mx-2 py-0 gap-0">
        {notifications.map((notif) => (
          <Item
            className="cursor-pointer hover:bg-muted mb-1 gap-0 p-0 rounded-lg transition-colors bg-muted/50"
            key={notif.senderId}
          >
            <ItemContent className="p-3">
              <Link href={`/messages/${notif.conversationId}`}>
                <div className='w-full flex items-center gap-3'>
                  <div className="shrink-0 relative">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                      <AvatarImage src={notif.senderAvatarUrl} />
                      <AvatarFallback>{notif.senderName[0]}</AvatarFallback>
                    </Avatar>
                    {/* Unread count badge */}
                    <span className="absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold h-4 min-w-4 px-1">
                      {notif.unreadCount}
                    </span>
                  </div>
                  <div className="flex-1 p-0 min-w-0">
                    <ItemTitle className="truncate text-sm sm:text-base font-semibold">
                      {notif.senderName}
                    </ItemTitle>
                    <ItemDescription className="line-clamp-1 text-xs">
                      {notif.unreadCount === 1
                        ? '1 new message'
                        : `${notif.unreadCount} new messages`}
                    </ItemDescription>
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