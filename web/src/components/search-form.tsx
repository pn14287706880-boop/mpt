"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar"

export function SearchForm({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <SidebarGroup className="py-0">
      <SidebarGroupContent className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 select-none opacity-50" />
        <Input
          type="search"
          placeholder="Search menu..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-8 h-8"
        />
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

