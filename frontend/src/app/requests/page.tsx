'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { UserCheck, UserX, Inbox, Send, X, Check, Clock } from 'lucide-react'
import { acceptConnectionRequest, cancelConnectionRequest, ConnectionRequest, getIncomingRequests, getOutgoingRequests, rejectConnectionRequest } from '@/lib/connections/service'
import { getTimeAgo } from '@/lib/utils'

export default function RequestsPage() {
  const [incomingRequests, setIncomingRequests] = useState<ConnectionRequest[]>([])
  const [outgoingRequests, setOutgoingRequests] = useState<ConnectionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadRequests()
  }, [])

  async function loadRequests() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    setLoading(true)

    const [incoming, outgoing] = await Promise.all([
      getIncomingRequests(user.id),
      getOutgoingRequests(user.id)
    ])

    setIncomingRequests(incoming)
    setOutgoingRequests(outgoing)
    setLoading(false)
  }

  async function handleAccept(connectionId: string) {
    setProcessingId(connectionId)

    try {
      await acceptConnectionRequest(connectionId)
      // Remove from incoming requests
      setIncomingRequests(prev => prev.filter(req => req.id !== connectionId))
    } catch (error: any) {
      console.error('Error accepting request:', error)
      alert(error.message || 'Failed to accept request')
    } finally {
      setProcessingId(null)
    }
  }

  async function handleReject(connectionId: string) {
    setProcessingId(connectionId)

    try {
      await rejectConnectionRequest(connectionId)
      // Remove from incoming requests
      setIncomingRequests(prev => prev.filter(req => req.id !== connectionId))
    } catch (error: any) {
      console.error('Error rejecting request:', error)
      alert(error.message || 'Failed to reject request')
    } finally {
      setProcessingId(null)
    }
  }

  async function handleCancel(connectionId: string) {
    setProcessingId(connectionId)

    try {
      await cancelConnectionRequest(connectionId)
      // Remove from outgoing requests
      setOutgoingRequests(prev => prev.filter(req => req.id !== connectionId))
    } catch (error: any) {
      console.error('Error canceling request:', error)
      alert(error.message || 'Failed to cancel request')
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen from-background to-muted/20 p-4 md:p-6">
        <div className="mx-auto max-w-4xl">
          <Skeleton className="h-10 md:h-12 w-48 md:w-64 mb-6 md:mb-8" />
          <div className="space-y-3 md:space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center gap-3 md:gap-4">
                    <Skeleton className="h-12 w-12 md:h-16 md:w-16 rounded-full flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Skeleton className="h-4 w-24 md:w-32 mb-2" />
                      <Skeleton className="h-3 w-16 md:w-24" />
                    </div>
                    <Skeleton className="h-10 w-20 md:w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen from-background to-muted/20 p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-2 md:gap-3">
            <Inbox className="h-8 w-8 md:h-10 md:w-10" />
            Connection Requests
          </h1>
          <p className="mt-2 text-sm md:text-base text-muted-foreground">
            Manage your pending connection requests
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="incoming" className="w-full">
          <TabsList className="mb-4 md:mb-6 w-full grid grid-cols-2">
            <TabsTrigger value="incoming" className="gap-1 md:gap-2 text-xs sm:text-sm">
              <Inbox className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Received</span>
              <span className="sm:hidden">Inbox</span>
              {incomingRequests.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">
                  {incomingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="outgoing" className="gap-1 md:gap-2 text-xs sm:text-sm">
              <Send className="h-3 w-3 md:h-4 md:w-4" />
              Sent
              {outgoingRequests.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {outgoingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Incoming Requests Tab */}
          <TabsContent value="incoming">
            {incomingRequests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Inbox className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    You don't have any connection requests at the moment. Check back later!
                  </p>
                  <Button className="mt-6" onClick={() => window.location.href = '/discover'}>
                    Discover People
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {incomingRequests.map(request => (
                  <IncomingRequestCard
                    key={request.id}
                    request={request}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    processing={processingId === request.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Outgoing Requests Tab */}
          <TabsContent value="outgoing">
            {outgoingRequests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Send className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Sent Requests</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    You haven't sent any connection requests yet. Start discovering people!
                  </p>
                  <Button className="mt-6" onClick={() => window.location.href = '/discover'}>
                    Discover People
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {outgoingRequests.map(request => (
                  <OutgoingRequestCard
                    key={request.id}
                    request={request}
                    onCancel={handleCancel}
                    processing={processingId === request.id}
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

// Incoming Request Card Component
function IncomingRequestCard({
  request,
  onAccept,
  onReject,
  processing
}: {
  request: ConnectionRequest
  onAccept: (id: string) => void
  onReject: (id: string) => void
  processing: boolean
}) {
  const sender = request.sender
  const timeAgo = getTimeAgo(new Date(request.created_at))

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start gap-3 md:gap-4">
          {/* Avatar */}
          <Avatar className="h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0">
            <AvatarImage src={sender.avatar_url ? sender.avatar_url : 'https://ui-avatars.com/api/?name=John+Doe&background=random'} alt={sender.username} />
            <AvatarFallback className="text-base sm:text-lg">
              {sender.full_name?.charAt(0)?.toUpperCase() || sender.username?.charAt(0)?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-2">
              <div className="min-w-0 w-full sm:w-auto">
                <h3 className="font-semibold text-base sm:text-lg truncate">
                  {sender.full_name || sender.username}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  @{sender.username}
                </p>
              </div>
              <Badge variant="secondary" className="text-xs w-fit">
                <Clock className="h-3 w-3 mr-1" />
                {timeAgo}
              </Badge>
            </div>

            {sender.bio && (
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3 md:mb-4">
                {sender.bio}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 w-full">
              <Button
                onClick={() => onAccept(request.id)}
                disabled={processing}
                className="flex-1 cursor-pointer text-sm"
                size="sm"
              >
                <Check className="h-4 w-4 mr-1 sm:mr-2" />
                {processing ? 'Processing...' : 'Accept'}
              </Button>
              <Button
                onClick={() => onReject(request.id)}
                disabled={processing}
                variant="outline"
                className="flex-1 cursor-pointer text-sm"
                size="sm"
              >
                <X className="h-4 w-4 mr-1 sm:mr-2" />
                Reject
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Outgoing Request Card Component
function OutgoingRequestCard({
  request,
  onCancel,
  processing
}: {
  request: ConnectionRequest
  onCancel: (id: string) => void
  processing: boolean
}) {
  const receiver = (request as any).receiver
  const timeAgo = getTimeAgo(new Date(request.created_at))

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start gap-3 md:gap-4">
          {/* Avatar */}
          <Avatar className="h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0">
            <AvatarImage src={receiver?.avatar_url ? receiver.avatar_url : 'https://ui-avatars.com/api/?name=John+Doe&background=random'} alt={receiver.username} />
            <AvatarFallback className="text-base sm:text-lg">
              {receiver.full_name?.charAt(0)?.toUpperCase() || receiver.username?.charAt(0)?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-2">
              <div className="min-w-0 w-full sm:w-auto">
                <h3 className="font-semibold text-base sm:text-lg truncate">
                  {receiver.full_name || receiver.username}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  @{receiver.username}
                </p>
              </div>
              <Badge variant="outline" className="text-xs w-fit">
                <Clock className="h-3 w-3 mr-1" />
                {timeAgo}
              </Badge>
            </div>

            {receiver.bio && (
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3 md:mb-4">
                {receiver.bio}
              </p>
            )}

            {/* Status and Cancel */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <Badge variant="secondary" className="gap-1 text-xs">
                <Clock className="h-3 w-3" />
                Pending
              </Badge>
              <Button
                onClick={() => onCancel(request.id)}
                disabled={processing}
                variant="ghost"
                size="sm"
                className="w-full sm:w-auto text-sm"
              >
                <X className="h-4 w-4 mr-1" />
                {processing ? 'Canceling...' : 'Cancel Request'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}