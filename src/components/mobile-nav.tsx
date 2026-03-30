"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { House, MagnifyingGlass, Microphone, ClockCounterClockwise } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/", label: "Home", icon: House },
  { href: "/search", label: "Explore", icon: MagnifyingGlass },
  { href: "/settings", label: "Voices", icon: Microphone },
  { href: "/history", label: "History", icon: ClockCounterClockwise },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden shrink-0 flex items-center border-t border-border bg-card h-14">
      {navLinks.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium transition-colors",
            pathname === href ? "text-foreground" : "text-muted-foreground"
          )}
        >
          <Icon weight={pathname === href ? "fill" : "regular"} className="size-5" />
          {label}
        </Link>
      ))}
    </nav>
  )
}
