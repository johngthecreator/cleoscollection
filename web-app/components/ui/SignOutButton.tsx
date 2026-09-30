"use client"

import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"

export default function SignOutButton() {
  const router = useRouter()

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          // Redirect the user to the landing page or login screen
          router.push("/login")
          router.refresh() // Refreshes the server-side state
        },
        onError: (ctx) => {
          alert(ctx.error.message || "Failed to log out.")
        }
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      aria-label="Sign out"
      className="flex size-14 items-center justify-center bg-white shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
    >
      <LogOut className="size-6" aria-hidden="true" />
    </button>
  )
}
