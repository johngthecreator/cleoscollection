"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Compass, Heart, Menu, X } from "lucide-react"
import SignOutButton from "@/components/ui/SignOutButton"

export default function DashboardNav() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <header className="flex justify-center px-5 pt-6 sm:px-10 sm:pt-8">
        <Link
          href="/dashboard"
          className="block"
          aria-label="Cleo’s Collection home"
        >
          <Image src="/cleos-collection-logo.png" alt="Cleo’s Collection" width={1113} height={130} priority className="h-auto w-44 sm:w-72" />
        </Link>
      </header>
      <nav aria-label="Dashboard actions" className="fixed right-5 bottom-5 z-50 flex flex-col items-end gap-3 sm:right-8 sm:bottom-8">
        {menuOpen && (
          <div id="dashboard-actions" className="flex flex-col items-end gap-3">
            <Link href="/dashboard" onClick={() => setMenuOpen(false)} aria-label="Browse" className="flex size-14 items-center justify-center bg-white shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
              <Compass className="size-6" aria-hidden="true" />
            </Link>
            <Link href="/dashboard/recommended" onClick={() => setMenuOpen(false)} aria-label="Recommended" className="flex size-14 items-center justify-center bg-white shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
              <Heart className="size-6" aria-hidden="true" />
            </Link>
            <SignOutButton />
          </div>
        )}
        <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="dashboard-actions" className="flex size-14 items-center justify-center bg-foreground text-background shadow-xl transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
          {menuOpen ? <X className="size-6" aria-hidden="true" /> : <Menu className="size-6" aria-hidden="true" />}
        </button>
      </nav>
    </>
  )
}
