'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

type Interest = {
  id: string
  name: string
  category: string
  icon: string | null
}

export default function SetupPage() {
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [allInterests, setAllInterests] = useState<Interest[]>([])
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    // Load user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profile) {
      setFullName(profile.full_name || '')
      setUsername(profile.username || '')
      setBio(profile.bio || '')
      setAvatarUrl(profile.avatar_url || '')
    }

    // Load all interests
    const { data: interests } = await supabase
      .from('interests')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    setAllInterests(interests || [])

    // Load user's selected interests
    const { data: userInterests } = await supabase
      .from('user_interests')
      .select('interest_id')
      .eq('user_id', user.id)

    if (userInterests) {
      setSelectedInterests(new Set(userInterests.map((ui: { interest_id: string }) => ui.interest_id)));
    }

    setLoading(false)
  }

  function toggleInterest(interestId: string) {
    setSelectedInterests(prev => {
      const newSet = new Set(prev)
      if (newSet.has(interestId)) {
        newSet.delete(interestId)
      } else {
        newSet.add(interestId)
      }
      return newSet
    })
  }

  async function handleSave() {
    if (selectedInterests.size === 0) {
      setMessage('Please select at least one interest')
      return
    }

    setSaving(true)
    setMessage('')

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        username: username,
        bio: bio,
        avatar_url: avatarUrl,
      })
      .eq('id', user.id)

    if (profileError) {
      setMessage('Error updating profile: ' + profileError.message)
      setSaving(false)
      return
    }

    // Delete existing interests
    await supabase
      .from('user_interests')
      .delete()
      .eq('user_id', user.id)

    // Insert new interests
    const interestsToInsert = Array.from(selectedInterests).map(interestId => ({
      user_id: user.id,
      interest_id: interestId
    }))

    const { error: interestsError } = await supabase
      .from('user_interests')
      .insert(interestsToInsert)

    if (interestsError) {
      setMessage('Error saving interests: ' + interestsError.message)
      setSaving(false)
      return
    }

    // Success - redirect to home
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Group interests by category
  const interestsByCategory = allInterests.reduce((acc, interest) => {
    const category = interest.category || 'Other'
    if (!acc[category]) acc[category] = []
    acc[category].push(interest)
    return acc
  }, {} as Record<string, Interest[]>)

  return (
    <div className="min-h-screen from-background to-muted/20 py-12 px-4">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Complete Your Profile</h1>
          <p className="mt-2 text-muted-foreground">
            Tell us about yourself to get personalized recommendations
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                This information will be visible to other users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarUrl ? avatarUrl : 'https://ui-avatars.com/api/?name=John+Doe&background=random'} alt={fullName} />
                  <AvatarFallback className="text-2xl">
                    {fullName?.charAt(0)?.toUpperCase() || username?.charAt(0)?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Label htmlFor="avatar">Profile Picture URL</Label>
                  <Input
                    id="avatar"
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="mt-2"
                  />
                  <p className="mt-1 text-sm text-muted-foreground">
                    Optional: Add a link to your profile picture
                  </p>
                </div>
              </div>

              <Separator />

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="johndoe"
                  value={username}
                  disabled
                />
                <p className="text-sm text-muted-foreground">
                  @{username || 'your-username'}
                </p>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  maxLength={500}
                />
                <p className="text-sm text-muted-foreground text-right">
                  {bio.length}/500
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Interests Card */}
          <Card>
            <CardHeader>
              <CardTitle>Your Interests</CardTitle>
              <CardDescription>
                Select at least one interest to help us recommend connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(interestsByCategory).map(([category, interests]) => (
                  <div key={category}>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      {category}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {interests.map(interest => (
                        <Badge
                          key={interest.id}
                          variant={selectedInterests.has(interest.id) ? "default" : "outline"}
                          className="cursor-pointer px-3 py-1.5 text-sm transition-all hover:scale-105"
                          onClick={() => toggleInterest(interest.id)}
                        >
                          {interest.icon && <span className="mr-1">{interest.icon}</span>}
                          {interest.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {selectedInterests.size} interest{selectedInterests.size !== 1 ? 's' : ''} selected
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex flex-col gap-4">
            {message && (
              <div className={`rounded-lg p-4 text-sm ${
                message.includes('Error') 
                  ? 'bg-destructive/10 text-destructive' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {message}
              </div>
            )}

            <Button
              onClick={handleSave}
              disabled={saving || selectedInterests.size === 0}
              size="lg"
              className="w-full cursor-pointer"
            >
              {saving ? 'Saving...' : 'Complete Setup'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              You can always update this later in settings
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}