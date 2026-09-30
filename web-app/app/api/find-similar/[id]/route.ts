import { tasks } from "@trigger.dev/sdk"
import { and, eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/db"
import { salesTable } from "@/db/schema"
import type { findSimilarItems } from "@/trigger/find-similar"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const saleId = Number(id)

  const body = await request.json(); // Read incoming JSON body

  const { brands, imageUrl } = body;

  if (!imageUrl) {
    return Response.json({ error: "Sale image not found" }, { status: 404 })
  }

  if (!process.env.TRIGGER_SECRET_KEY) {
    return Response.json({ error: "Trigger.dev is not configured" }, { status: 503 })
  }

  try {
    const handle = await tasks.trigger<typeof findSimilarItems>("find-similar-items", {
      saleId,
      userId: session.user.id,
      userStyle: session.user.userStyle ?? "",
      userDepartment: session.user.department ?? "",
      imageUrl,
      brands
    })
    return Response.json({ runId: handle.id, publicAccessToken: handle.publicAccessToken })
  } catch (error) {
    console.error("Could not start similar item search", error)
    return Response.json({ error: "Could not start the search" }, { status: 502 })
  }
}
