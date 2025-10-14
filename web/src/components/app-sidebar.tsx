"use client"

import * as React from "react"
import {
  BookOpen,
  Bot,
  GalleryVerticalEnd,
  Settings2,
  SquareTerminal,
  Palette,
  TrendingUp,
  Plane,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { SearchForm } from "@/components/search-form"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Medpage Today",
      logo: GalleryVerticalEnd,
      plan: "",
    },
  ],
  navMain: [
    {
      title: "Platform",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "RunJob",
          url: "/runjob",
        },
        {
          title: "DatabricksUsage",
          url: "/databricks-usage",
        },
        {
          title: "Pro360",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Palette,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: TrendingUp,
    },
    {
      name: "Travel",
      url: "#",
      icon: Plane,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const { state } = useSidebar()

  // Filter navigation items based on search query
  const filteredNavMain = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return data.navMain
    }

    const query = searchQuery.toLowerCase()
    return data.navMain
      .map((section) => {
        // Check if section title matches
        const sectionMatches = section.title.toLowerCase().includes(query)
        
        // Filter sub-items that match
        const filteredItems = section.items?.filter((item) =>
          item.title.toLowerCase().includes(query)
        )

        // Include section if title matches OR if it has matching sub-items
        if (sectionMatches || (filteredItems && filteredItems.length > 0)) {
          return {
            ...section,
            items: sectionMatches ? section.items : filteredItems,
            isActive: true, // Auto-expand sections with matches
          }
        }

        return null
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
  }, [searchQuery])

  // Filter projects based on search query
  const filteredProjects = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return data.projects
    }

    const query = searchQuery.toLowerCase()
    return data.projects.filter((project) =>
      project.name.toLowerCase().includes(query)
    )
  }, [searchQuery])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
        {state === "expanded" && (
          <SearchForm value={searchQuery} onChange={(value) => setSearchQuery(value)} />
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavMain} />
        <NavProjects projects={filteredProjects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
