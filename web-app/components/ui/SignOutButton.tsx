"use client"

import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

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
      onClick={handleSignOut}
      className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition"
    >
      Sign Out
    </button>
  )
}
