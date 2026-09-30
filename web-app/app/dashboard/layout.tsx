import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import DashboardNav from "@/components/dashboard-nav"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
      headers: await headers()
  })

  if (!session) {
      redirect("/login")
  }

  if (session.user.userStyle == null) {
      redirect("/welcome")
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#faf9f6] text-foreground">
      <DashboardNav />
      {children}
    </div>
  )
}
