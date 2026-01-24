'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getRecommendedUsers, getNewUsers, sendConnectionRequest, type RecommendedUser } from '@/lib/recommendations/service'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { UserPlus, Users, Sparkles, Check } from 'lucide-react'
import UserCard from '@/components/user-card'

export default function DiscoverPage() {
  const [recommendedUsers, setRecommendedUsers] = useState<RecommendedUser[]>([])
  const [newUsers, setNewUsers] = useState<RecommendedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [requestsSent, setRequestsSent] = useState<Set<string>>(new Set())
  const [sendingRequest, setSendingRequest] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    setLoading(true)

    // Load both recommended and new users in parallel
    const [recommended, newMembers] = await Promise.all([
      getRecommendedUsers(user.id, 20),
      getNewUsers(user.id, 20)
    ])

    setRecommendedUsers(recommended)
    setNewUsers(newMembers)
    setLoading(false)
  }

  async function handleSendRequest(receiverId: string) {
    setSendingRequest(receiverId)

    try {
      await sendConnectionRequest(receiverId)
      setRequestsSent(prev => new Set([...prev, receiverId]))
    } catch (error: unknown) {
      console.error('Error sending request:', error)
      if (error instanceof Error) {
        alert(error.message)
      } else {
        alert('Failed to send connection request')
      }
    } finally {
      setSendingRequest(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen from-background to-muted/20 p-4 md:p-6">
        <div className="mx-auto max-w-6xl">
          <Skeleton className="h-10 md:h-12 w-48 md:w-64 mb-6 md:mb-8" />
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <Skeleton className="h-4 w-32 mt-2" />
                  <Skeleton className="h-3 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen from-background to-muted/20 p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-2 md:gap-3">
            <Users className="h-8 w-8 md:h-10 md:w-10" />
            Discover People
          </h1>
          <p className="mt-2 text-sm md:text-base text-muted-foreground">
            Connect with people who share your interests
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="recommended" className="w-full">
          <TabsList className="mb-4 md:mb-6 w-full sm:w-auto grid grid-cols-2 sm:inline-grid">
            <TabsTrigger value="recommended" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">For You</span>
              <span className="sm:hidden">Recommended</span>
              {recommendedUsers.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {recommendedUsers.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="new" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
              New Members
              {newUsers.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {newUsers.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Recommended Users Tab */}
          <TabsContent value="recommended">
            {recommendedUsers.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Sparkles className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Recommendations Yet</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    We couldn&apos;t find users with shared interests. Try adding more interests to your profile or check back later!
                  </p>
                  <Button className="mt-6 cursor-pointer" onClick={() => window.location.href = '/setup/'}>
                    Update Interests
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {recommendedUsers.map(user => (
                  <UserCard
                    key={user.id}
                    user={user}
                    onSendRequest={handleSendRequest}
                    requestSent={requestsSent.has(user.id)}
                    sending={sendingRequest === user.id}
                    showSharedInterests
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* New Users Tab */}
          <TabsContent value="new">
            {newUsers.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <UserPlus className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No New Members</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    There are no new members to show right now. Check back later!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {newUsers.map(user => (
                  <UserCard
                    key={user.id}
                    user={user}
                    onSendRequest={handleSendRequest}
                    requestSent={requestsSent.has(user.id)}
                    sending={sendingRequest === user.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}