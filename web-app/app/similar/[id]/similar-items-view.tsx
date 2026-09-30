"use client"

import Link from "next/link"
import { useRealtimeRun } from "@trigger.dev/react-hooks"
import { X } from "lucide-react"
import type { findSimilarItems } from "@/trigger/find-similar"
import ProductCarousel, { type CarouselProduct } from "@/components/product-carousel"

type ReferenceSale = {
  id: number
  name: string
  source: string
  hostedImageUrl: string | null
  imageUrl: string | null
}

type RunHandle = { runId: string; publicAccessToken: string }

type Product = CarouselProduct & { reason: string }

function SimilarResults({ handle }: { handle: RunHandle }) {
  const { run, error } = useRealtimeRun<typeof findSimilarItems>(handle.runId, { accessToken: handle.publicAccessToken })
  const products = (run?.output?.products ?? []) as Product[]

  if (error) return <p className="py-20 text-center text-destructive" role="alert">Could not receive search updates: {error.message}</p>
  if (run?.status && ["FAILED", "CRASHED", "SYSTEM_FAILURE", "TIMED_OUT", "CANCELED", "EXPIRED"].includes(run.status)) {
    return <p className="py-20 text-center text-destructive" role="alert">The search could not be completed. Please go back and try again.</p>
  }
  if (run?.status !== "COMPLETED") {
    const stage = run?.metadata && typeof run.metadata === "object" && "stage" in run.metadata ? String(run.metadata.stage) : "Starting your search"
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center px-6 text-center" role="status" aria-live="polite">
        <div className="mb-6 size-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
        <h2 className="text-2xl font-medium">Finding pieces like this</h2>
        <p className="mt-2 text-muted-foreground">{stage}…</p>
      </div>
    )
  }
  if (!products.length) {
    return <div className="flex min-h-[55vh] flex-col items-center justify-center px-6 text-center"><h2 className="text-2xl font-medium">No close matches found.</h2><p className="mt-2 max-w-md text-muted-foreground">We couldn’t find a strong match for this item in the current sale collection.</p></div>
  }

  return <ProductCarousel products={products} label="Similar items" />
}

export default function SimilarItemsView({ sale, handle }: { sale: ReferenceSale; handle: RunHandle | null }) {

  return (
    <main
      className="flex min-h-dvh flex-col overflow-x-clip bg-[#faf9f6] text-foreground"
      style={{ backgroundImage: "radial-gradient(#dedcd6 1px, transparent 1px)", backgroundSize: "28px 28px" }}
    >
      <header className="flex items-center gap-4 px-5 py-6 sm:px-10 sm:py-8">
        <Link href="/dashboard" aria-label="Back to browse" className="flex size-11 items-center justify-center border border-foreground/25 bg-[#faf9f6] transition-colors hover:bg-foreground hover:text-background"><X aria-hidden="true" className="size-5" /></Link>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Similar to</p>
          <h1 className="line-clamp-1 text-lg font-medium sm:text-xl">{sale.name}</h1>
        </div>
      </header>
      {handle ? <SimilarResults handle={handle} /> : <p className="mx-auto py-20 text-center text-destructive" role="alert">No search was started for this item. Go back and select Find similar items.</p>}
    </main>
  )
}
