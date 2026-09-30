"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import axios from "axios"
import useSWR, { useSWRConfig } from "swr"
import { useRealtimeRun } from "@trigger.dev/react-hooks"
import type { getRecommendations } from "@/trigger/get-recommendations"
import ProductCarousel, { type CarouselProduct } from "@/components/product-carousel"

type Product = CarouselProduct

type RunHandle = { runId: string; publicAccessToken: string }

const runKey = "recommendations-run"
const runChanged = "recommendations-run-changed"
const fetcher = (url: string) => axios.get<Product[]>(url).then((response) => response.data)
const subscribe = (callback: () => void) => {
  window.addEventListener(runChanged, callback)
  return () => window.removeEventListener(runChanged, callback)
}
const readRun = () => sessionStorage.getItem(runKey)

function saveRun(handle: RunHandle | null) {
  if (handle) sessionStorage.setItem(runKey, JSON.stringify(handle))
  else sessionStorage.removeItem(runKey)
  window.dispatchEvent(new Event(runChanged))
}

function RunTracker({ handle }: { handle: RunHandle }) {
  const { run, error } = useRealtimeRun<typeof getRecommendations>(handle.runId, { accessToken: handle.publicAccessToken })
  const { mutate } = useSWRConfig()

  useEffect(() => {
    if (run?.status === "COMPLETED") {
      saveRun(null)
      void mutate("/api/recommendations")
    }
  }, [run?.status, mutate])

  if (error || (run?.status && ["FAILED", "CRASHED", "SYSTEM_FAILURE", "TIMED_OUT", "CANCELED", "EXPIRED"].includes(run.status))) {
    return <div className="mt-5 text-sm text-destructive">The search did not finish. <button type="button" onClick={() => saveRun(null)} className="underline">Try again</button></div>
  }

  return <p className="mt-5 text-sm text-muted-foreground" role="status">Finding your recommendations…</p>
}

export default function RecommendedPage() {
  const { data: products, error, isLoading } = useSWR("/api/recommendations", fetcher)
  const storedRun = useSyncExternalStore(subscribe, readRun, () => null)
  const [starting, setStarting] = useState(false)
  const startingRef = useRef(false)
  const [startError, setStartError] = useState("")
  let handle: RunHandle | null = null
  try {
    const parsed = storedRun ? JSON.parse(storedRun) as Partial<RunHandle> : null
    if (typeof parsed?.runId === "string" && typeof parsed.publicAccessToken === "string") {
      handle = { runId: parsed.runId, publicAccessToken: parsed.publicAccessToken }
    }
  } catch { /* An invalid stored handle can be replaced by a new run. */ }

  async function generate() {
    if (startingRef.current || handle) return
    startingRef.current = true
    setStarting(true)
    setStartError("")
    try {
      const { data } = await axios.post<RunHandle>("/api/get-recommendations")
      if (!data.runId || !data.publicAccessToken) throw new Error("The search did not return a run handle")
      saveRun(data)
    } catch (error) {
      setStartError(axios.isAxiosError(error) ? error.response?.data?.error ?? error.message : error instanceof Error ? error.message : "Could not start recommendations")
    } finally {
      startingRef.current = false
      setStarting(false)
    }
  }

  return (
    <main className="flex flex-1 flex-col overflow-x-clip py-12" style={{ backgroundImage: "radial-gradient(#dedcd6 1px, transparent 1px)", backgroundSize: "28px 28px" }}>
      {products?.length ? (
        <>
          <div className="mx-auto w-full max-w-5xl px-5 sm:px-10">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">Recommended</h1>
              </div>
              <button type="button" onClick={generate} disabled={starting || !!handle} className="bg-foreground px-5 py-3 text-sm font-medium text-background disabled:opacity-50">Regenerate</button>
            </div>
            {startError && <p className="mt-5 text-sm text-destructive" role="alert">{startError}</p>}
            {handle && <RunTracker handle={handle} />}
          </div>
          <ProductCarousel products={products} label="Recommended items" />
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center px-6 text-center">
          <div className="max-w-xl">
            {isLoading ? <p className="text-muted-foreground">Loading recommendations…</p>
              : error ? <p className="text-destructive">Could not load recommendations.</p>
              : <>
                  <h1 className="mt-4 text-3xl font-medium tracking-tight sm:text-4xl">Let us curate your style from this week’s sales.</h1>
                  <button type="button" onClick={generate} disabled={starting || !!handle} className="mt-8 bg-foreground px-6 py-3 text-sm font-medium text-background disabled:opacity-50">{starting || handle ? "Curating…" : "Get recommendations"}</button>
                  {startError && <p className="mt-5 text-sm text-destructive" role="alert">{startError}</p>}
                  {handle && <RunTracker handle={handle} />}
                </>}
          </div>
        </div>
      )}
    </main>
  )
}
