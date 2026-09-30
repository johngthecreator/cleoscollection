import { and, eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/db"
import { recommendationsTable, salesTable } from "@/db/schema"

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const products = await db.select({
    id: salesTable.id,
    name: salesTable.name,
    source: salesTable.source,
    url: salesTable.url,
    currentPrice: salesTable.currentPrice,
    originalPrice: salesTable.originalPrice,
    hostedImageUrl: salesTable.hostedImageUrl,
    imageUrl: salesTable.imageUrl,
  }).from(recommendationsTable).innerJoin(salesTable, eq(recommendationsTable.saleId, salesTable.id)).where(and(
    eq(recommendationsTable.userId, session.user.id),
    eq(salesTable.isActive, true),
  ))

  return Response.json(products)
}
