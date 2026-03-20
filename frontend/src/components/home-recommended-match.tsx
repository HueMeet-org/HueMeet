"use client";
import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { UserProfileComplete } from '@/types/user'
import { Skeleton } from './ui/skeleton'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from './ui/empty'
import Link from 'next/link'
import { Button } from './ui/button'
import { Item, ItemContent, ItemDescription, ItemTitle } from './ui/item'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { getRecommendedUsers } from '@/lib/profile/service'

export const HomeRecommendedMatch = () => {
  const [matches, setMatches] = useState<UserProfileComplete[]>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecommendedUsers()
      .then(setMatches)
      .catch((err) => {
        console.error('Failed to fetch recommended users:', err);
        setMatches([]);
      })
      .finally(() => setLoading(false));
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

  if (!matches || matches.length === 0) {
    return (
      <Card>
        <CardContent>
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No Matches</EmptyTitle>
              <EmptyDescription>No recommended users found</EmptyDescription>
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
    <Card className="h-full flex flex-col m-0 p-0 gap-0">
      <CardHeader className="py-4 px-4">
        <CardTitle className="text-base sm:text-lg">Recommended Matches</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 px-0  mx-2 py-0 gap-0">
        {matches.map((user) => (
          <Item className='cursor-pointer gap-0 p-0 hover:bg-muted rounded-lg transition-colors' key={user.username}>
            <ItemContent className="p-3">
              <Link href={`/profile/${user.username}`} >
                <div className='w-full flex items-center gap-3'>
                  <div className="shrink-0">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                      <AvatarImage src={user.imageUrl} />
                      <AvatarFallback>{user.fullName[0]}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 p-0">
                    <ItemTitle className="truncate text-sm sm:text-base">{user.fullName}</ItemTitle>
                    <ItemDescription className="line-clamp-1 text-xs sm:text-xs">{user.bio}</ItemDescription>
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
