import { tasks } from "@trigger.dev/sdk"
import { auth } from "@/lib/auth"
import type { getRecommendations } from "@/trigger/get-recommendations"

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const handle = await tasks.trigger<typeof getRecommendations>("get-recommendations", {
    userId: session.user.id,
    userStyle: session.user.userStyle ?? "",
    department: session.user.department ?? "",
  })

  return Response.json({ runId: handle.id, publicAccessToken: handle.publicAccessToken })
}
