"use client"

import { Bell, Calendar, Home, Inbox, Search, Settings } from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { NavUser } from "./nav-user"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

interface UserProfile {
    imageUrl: string;
    username: string;
    fullName: string;
}

// Menu items.
const items = [
    {
        title: "Home",
        url: "/",
        icon: Home,
    },
    {
        title: "Discover",
        url: "/discover",
        icon: Search,
    },
    {
        title: "Messages",
        url: "/messages",
        icon: Inbox,
    },
    {
        title: "Requests",
        url: "/requests",
        icon: Bell,
    }
]

export function AppSidebar() {
    const [userData, setUserData] = useState<UserProfile | null>(null);
    const pathname = usePathname()
    const supabase = createClient()

    const getUserData = async () => {
        const { data: { user } } = await supabase.auth.getUser()

        // If no user is logged in at all, stop here
        if (!user) return null;

        const { data, error } = await supabase
            .from("profiles")
            .select('avatar_url, username, full_name')
            .eq('id', user.id)
            .single()

        if (error) {
            console.error('Error fetching user data:', error)
            return null
        }

        // 1. Get values from the profile table
        const username = data.username
        const fullName = data.full_name

        // 2. Logic for Avatar URL
        // Priority: Database -> Google Metadata -> Default Local Icon
        let imageUrl = data.avatar_url;

        if (!imageUrl) {
            imageUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || '/globe.svg';
        }

        return { imageUrl, username, fullName }
    }

    useEffect(() => {
        // Create an internal async function to call the data
        const fetchUser = async () => {
            const data = await getUserData(); // Wait for the promise to resolve
            if (data) {
                setUserData(data);
            }
        };

        fetchUser();
    }, []);

    if (pathname === "/login" || pathname === "/signup") {
        return null
    }

    return (
        <Sidebar>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                        >
                            <Link href={'/'} className="text-xl font-semibold">Hue<span className="-ml-2 font-extrabold">Meet</span></Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={userData} />
            </SidebarFooter>
        </Sidebar>
    )
}