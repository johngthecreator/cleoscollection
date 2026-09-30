import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/db"
import { salesTable } from "@/db/schema"
import SimilarItemsView from "./similar-items-view"

export default async function SimilarItemsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ runId?: string | string[]; token?: string | string[] }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")
  if (session.user.userStyle == null) redirect("/welcome")

  const { id } = await params
  const [sale] = await db.select({
    id: salesTable.id,
    name: salesTable.name,
    source: salesTable.source,
    hostedImageUrl: salesTable.hostedImageUrl,
    imageUrl: salesTable.imageUrl,
  }).from(salesTable).where(and(eq(salesTable.id, Number(id)), eq(salesTable.isActive, true))).limit(1)
  if (!sale) notFound()

  const query = await searchParams
  const handle = typeof query.runId === "string" && typeof query.token === "string"
    ? { runId: query.runId, publicAccessToken: query.token }
    : null

  return <SimilarItemsView sale={sale} handle={handle} />
}
