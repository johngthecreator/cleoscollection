'use client'

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown } from "lucide-react"
import axios from "axios"
import useSWR from 'swr'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import ProductCarousel, { type CarouselProduct } from "@/components/product-carousel"

type Sale = CarouselProduct

type RunHandle = { runId: string; publicAccessToken: string }

const brandOptions = [
  { value: "nike", label: "Nike" },
  { value: "gymshark", label: "Gymshark" },
  { value: "urban_outfitters", label: "Urban Outfitters" },
  { value: "allsaints", label: "AllSaints" },
] as const

const fetcher = (url: string) => axios.get<Sale[]>(url).then(res => res.data)

export default function Dashboard() {
  const router = useRouter()
  const [browseBrand, setBrowseBrand] = useState("nike")
  const { data: sales, error, isLoading } = useSWR(`/api/sales?brand=${browseBrand}`, fetcher)
  const [similarError, setSimilarError] = useState("")
  const [startingSimilar, setStartingSimilar] = useState(false)
  const startingSimilarRef = useRef(false)
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [brandDialogOpen, setBrandDialogOpen] = useState(false)
  const [referenceSale, setReferenceSale] = useState<Sale | null>(null)

  const visibleSales = sales?.filter((sale) => sale.hostedImageUrl || sale.imageUrl) ?? []
  const brandSelect = (
    <label className="relative inline-flex items-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
      <span className="sr-only">Browse brand</span>
      <select value={browseBrand} onChange={(event) => setBrowseBrand(event.target.value)} className="cursor-pointer appearance-none bg-transparent py-1 pr-5 text-center uppercase tracking-[0.2em] focus:outline-none focus-visible:text-foreground">
        {brandOptions.map((brand) => (
          <option key={brand.value} value={brand.value}>{brand.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-0 size-3" aria-hidden="true" />
    </label>
  )

  function openBrandPicker(sale: Sale) {
    setReferenceSale(sale)
    setSimilarError("")
    setBrandDialogOpen(true)
  }

  function toggleBrand(brand: string) {
    setSelectedBrands((current) => current.includes(brand)
      ? current.filter((value) => value !== brand)
      : [...current, brand])
  }

  async function findSimilarItems() {
    if (!referenceSale || !selectedBrands.length || startingSimilarRef.current) return
    startingSimilarRef.current = true
    setStartingSimilar(true)
    setSimilarError("")

    try {
      const { data } = await axios.post<RunHandle>(`/api/find-similar/${referenceSale.id}`, {
        imageUrl: referenceSale.hostedImageUrl ? `/api/sale-images/${referenceSale.id}` : referenceSale.imageUrl,
        brands: selectedBrands,
      })
      if (typeof data.runId !== "string" || typeof data.publicAccessToken !== "string") {
        throw new Error("The search did not return a run handle")
      }
      const query = new URLSearchParams({ runId: data.runId, token: data.publicAccessToken })
      setBrandDialogOpen(false)
      router.push(`/similar/${referenceSale.id}?${query}`)
    } catch (error) {
      setSimilarError(axios.isAxiosError(error) ? error.response?.data?.error ?? error.message : error instanceof Error ? error.message : "Could not start the search")
      startingSimilarRef.current = false
      setStartingSimilar(false)
    }
  }

  if (isLoading) {
    return <main className="flex flex-1 items-center justify-center">Loading finds…</main>
  }

  return (
    <main className="flex flex-1 flex-col overflow-x-clip pb-6 sm:pb-8" style={{ backgroundImage: "radial-gradient(#dedcd6 1px, transparent 1px)", backgroundSize: "28px 28px" }}>
        {error ? (
          <p className="my-auto text-center text-muted-foreground">Could not load sales.</p>
        ) : !visibleSales.length ? (
          <div className="my-auto flex flex-col items-center gap-4 text-center text-muted-foreground">{brandSelect}<p>No sale images available for this brand.</p></div>
        ) : (
          <ProductCarousel
            key={browseBrand}
            products={visibleSales}
            label="Latest sale finds"
            eyebrow={() => brandSelect}
            extraAction={(sale) => <button type="button" onClick={() => openBrandPicker(sale)} className="ml-4 inline-block border-b border-current pb-0.5 text-sm font-medium">Find similar items</button>}
          />
        )}
      <Dialog open={brandDialogOpen} onOpenChange={(open) => { if (!startingSimilar) setBrandDialogOpen(open) }}>
        <DialogContent showCloseButton={!startingSimilar} className="w-[min(90vw,28rem)] bg-[#faf9f6] p-6 sm:max-w-md sm:p-8">
        <form onSubmit={(event) => { event.preventDefault(); void findSimilarItems() }}>
          <DialogHeader>
            <DialogTitle className="text-xl">Choose brands</DialogTitle>
            <DialogDescription>Select the brands to search for similar items.</DialogDescription>
          </DialogHeader>
          <div className="mt-6 grid gap-3">
            {brandOptions.map((brand) => (
              <label key={brand.value} className="flex cursor-pointer items-center gap-3 border border-foreground/15 bg-white px-4 py-3 text-sm">
                <input type="checkbox" checked={selectedBrands.includes(brand.value)} onChange={() => toggleBrand(brand.value)} disabled={startingSimilar} className="size-4 accent-foreground" />
                {brand.label}
              </label>
            ))}
          </div>
          {similarError && <p className="mt-4 text-sm text-destructive" role="alert">{similarError}</p>}
          <DialogFooter className="mt-7 border-0 bg-transparent p-0 sm:justify-end">
            <button type="button" onClick={() => setBrandDialogOpen(false)} disabled={startingSimilar} className="border border-foreground/20 px-4 py-2 text-sm disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={!selectedBrands.length || startingSimilar} className="bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50">{startingSimilar ? "Starting search…" : "Find similar items"}</button>
          </DialogFooter>
        </form>
        </DialogContent>
      </Dialog>
    </main>
  )
}
