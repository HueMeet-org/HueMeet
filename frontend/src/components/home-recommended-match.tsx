"use client";
import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { UserProfileComplete } from '@/types/user'
import { Skeleton } from './ui/skeleton'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from './ui/empty'
import Link from 'next/link'
import { Button } from './ui/button'
import { Item, ItemContent, ItemDescription, ItemTitle } from './ui/item'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'


export const recommendedMatchesMock: UserProfileComplete[] = [
  {
    imageUrl: "https://i.pravatar.cc/150?img=11",
    username: "aarav_s",
    fullName: "Aarav Sharma",
    bio: "AI enthusiast and coffee lover ☕",
    interests_count: 12,
    connections_count: 450,
    aura: 95,
  },
  {
    imageUrl: "https://i.pravatar.cc/150?img=32",
    username: "neha_v",
    fullName: "Neha Verma",
    bio: "Full stack explorer and digital nomad.",
    interests_count: 8,
    connections_count: 210,
    aura: 88,
  },
  {
    imageUrl: "https://i.pravatar.cc/150?img=45",
    username: "rohan_m",
    fullName: "Rohan Mehta",
    bio: "Building the future of social tech.",
    interests_count: 15,
    connections_count: 890,
    aura: 102,
  },
  {
    imageUrl: "https://i.pravatar.cc/150?img=28",
    username: "priya_singh",
    fullName: "Priya Singh",
    bio: "UI/UX Designer | Nature Photographer",
    interests_count: 20,
    connections_count: 320,
    aura: 91,
  },
  {
    imageUrl: "https://i.pravatar.cc/150?img=53",
    username: "kunal_p",
    fullName: "Kunal Patel",
    bio: "Always learning, always coding.",
    interests_count: 5,
    connections_count: 120,
    aura: 75,
  },
]
export const HomeRecommendedMatch = () => {
  const [matches, setMatches] = useState<UserProfileComplete[]>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulating data fetch
    setMatches(recommendedMatchesMock);
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
    <Card>
      <CardHeader>
        <CardTitle>Recommended Matches</CardTitle>
      </CardHeader>
      <CardContent>
        {matches.map((user) => (
          <Item className='cursor-pointer hover:bg-muted' key={user.username}>
            <ItemContent>
              <Link href={`/profile/${user.username}`} >
                <div className='w-full flex'>
                  <div className="">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.imageUrl} />
                      <AvatarFallback>{user.fullName[0]}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="ml-2">
                    <ItemTitle>{user.fullName}</ItemTitle>
                    <ItemDescription className="line-clamp-1">{user.bio}</ItemDescription>
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
