import { Check, UserPlus } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { RecommendedUser } from "@/lib/recommendations/service"
import { Badge } from "./ui/badge"

export default function UserCard({
  user,
  onSendRequest,
  requestSent,
  sending,
  showSharedInterests = false
}: {
  user: RecommendedUser
  onSendRequest: (userId: string) => void
  requestSent: boolean
  sending: boolean
  showSharedInterests?: boolean
}) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3 md:gap-4">
          <Avatar className="h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0">
            <AvatarImage src={user.avatar_url || undefined} alt={user.username} />
            <AvatarFallback className="text-base sm:text-lg">
              {user.full_name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg truncate">{user.full_name || user.username}</CardTitle>
            <CardDescription className="truncate text-xs sm:text-sm">@{user.username}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 flex-1">
        {/* Bio */}
        {user.bio && (
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
            {user.bio}
          </p>
        )}

        {/* Shared Interests */}
        {showSharedInterests && user.interests && user.interests.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              {user.shared_interests_count} shared interest{user.shared_interests_count !== 1 ? 's' : ''}
            </p>
            <div className="flex flex-wrap gap-1">
              {user.interests.slice(0, 3).map((interest: any) => (
                <Badge key={interest.id} variant="secondary" className="text-xs">
                  {interest.icon && <span className="mr-1">{interest.icon}</span>}
                  {interest.name}
                </Badge>
              ))}
              {user.interests.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{user.interests.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter>
        {requestSent ? (
          <Button disabled className="w-full text-sm" variant="secondary" size="sm">
            <Check className="mr-2 h-4 w-4" />
            Request Sent
          </Button>
        ) : (
          <Button
            onClick={() => onSendRequest(user.id)}
            disabled={sending}
            className="w-full cursor-pointer text-sm"
            size="sm"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {sending ? 'Sending...' : 'Connect'}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}