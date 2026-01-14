import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { createClient } from "./supabase/client"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const supabase = createClient()

export async function checkUserNameExists(username: string): Promise<boolean> {
  const { data, error } = await supabase.from('profiles').select('id').eq('username', username.toLowerCase()).maybeSingle()
  if (error) {
    console.error('Error checking username existence:', error)
    return false
  }
  return data !== null
}

export function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + 'y ago'

  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + 'mo ago'

  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + 'd ago'

  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + 'h ago'

  interval = seconds / 60
  if (interval > 1) return Math.floor(interval) + 'm ago'

  return 'just now'
}