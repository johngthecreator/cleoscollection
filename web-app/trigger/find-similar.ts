import { HumanMessage, SystemMessage, type ContentBlock } from "@langchain/core/messages"
import { metadata, task } from "@trigger.dev/sdk"
import { and, eq, inArray } from "drizzle-orm"
import { shopper } from "@/agent/agent"
import { db } from "@/db"
import { salesTable } from "@/db/schema"

export const findSimilarItems = task({
  id: "find-similar-items",
  maxDuration: 600,
  run: async (payload: { saleId: number; userId: string, userStyle: string, userDepartment: string, imageUrl: string, brands: string[] }) => {
    metadata.set("stage", "Loading the reference item")
    await metadata.flush()

    const content: ContentBlock[] = [
      { type: "text", text: "Find me similar items." },
    ]

    if (payload.saleId) {
      if (!process.env.BETTER_AUTH_URL) throw new Error("BETTER_AUTH_URL is required to fetch the reference image")
      const imageUrl = new URL(`/api/sale-images/${payload.saleId}`, process.env.BETTER_AUTH_URL)
      const response = await fetch(imageUrl)
      if (!response.ok) throw new Error("Reference image could not be loaded")
      const bytes = Buffer.from(await response.arrayBuffer())
      const contentType = response.headers.get("content-type") ?? "image/webp"
      content.push({ type: "image_url", image_url: { url: `data:${contentType};base64,${bytes.toString("base64")}`, detail: "low" } })
    } else {
      throw new Error("Reference item has no image")
    }

    metadata.set("stage", "Finding similar pieces")
    await metadata.flush()

    const prompt = `You are a personal shopping researcher. Find sale items similar to the attached reference image.

    Reference sale ID: ${payload.saleId}
    Shopper's style preferences: ${payload.userStyle || "None provided"}
    Allowed brands: ${payload.brands.join(", ")}
    Department: ${payload.userDepartment}

    Call get_sales for each allowed brand with this department. Consider only products returned by the tool. Exclude the reference item itself.

    Identify the reference item's recognizable garment category and function, then its silhouette, fit, color placement, material appearance, texture, and design details. Keep candidates in the same category and function: a similar color or style alone does not make a different type of garment a match. Within that category, rank candidates by overall visual similarity and the shopper's preferences. Treat details as factors to weigh, not exact requirements; related items can have different graphics, colors, or trim.

    Return up to five credible matches ranked by relevance. For each, provide the exact saleId from get_sales and a short, specific reason explaining the strongest similarities and any meaningful differences. Return fewer matches, including zero, if the database has no good options. Ground every claim in the image or tool data; do not invent product details, materials, prices, or availability.`

    const result = await shopper.invoke([
      new SystemMessage(prompt),
      new HumanMessage({ content }),
    ])

    metadata.set("stage", "Preparing your matches")
    await metadata.flush()

    const matches = result.products.filter((item) => Number.isInteger(item.saleId) && item.saleId !== payload.saleId).slice(0, 5)
    const ids = [...new Set(matches.map((item) => item.saleId))]
    const verifiedSales = ids.length
      ? await db.select().from(salesTable).where(and(inArray(salesTable.id, ids), eq(salesTable.isActive, true), eq(salesTable.department, payload.userDepartment)))
      : []
    const salesById = new Map(verifiedSales.map((sale) => [sale.id, sale]))

    return {
      products: matches.flatMap((match) => {
        const sale = salesById.get(match.saleId)
        if (!sale || (!sale.hostedImageUrl && !sale.imageUrl)) return []
        return [{
          id: sale.id,
          name: sale.name,
          source: sale.source,
          url: sale.url,
          currentPrice: sale.currentPrice,
          originalPrice: sale.originalPrice,
          hostedImageUrl: sale.hostedImageUrl,
          imageUrl: sale.imageUrl,
          reason: match.reason,
        }]
      }),
    }
  },
})
