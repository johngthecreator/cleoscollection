"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import Image from "next/image"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"

export type CarouselProduct = {
  id: number
  name: string
  source: string
  url: string
  currentPrice: string
  originalPrice: string | null
  hostedImageUrl: string | null
  imageUrl: string | null
  reason?: string
}

type Props<T extends CarouselProduct> = {
  products: T[]
  label: string
  eyebrow?: (product: T, index: number, total: number) => ReactNode
  extraAction?: (product: T) => ReactNode
}

function relativeIndex(index: number, selected: number, length: number) {
  const forward = (index - selected + length) % length
  return forward > length / 2 ? forward - length : forward
}

function cardRotation(offset: number) {
  if (offset === -2) return -10
  if (offset === -1) return 6
  if (offset === 1) return -7
  if (offset === 2) return 11
  return 0
}

export default function ProductCarousel<T extends CarouselProduct>({ products, label, eyebrow, extraAction }: Props<T>) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [viewportWidth, setViewportWidth] = useState(1024)
  const carouselRef = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()
  const activeIndex = selectedIndex % products.length
  const activeProduct = products[activeIndex]
  const cardWidth = Math.min(400, Math.max(190, viewportWidth * 0.28))
  const cardStep = Math.min(450, Math.max(180, viewportWidth * 0.25))

  useEffect(() => {
    const updateWidth = () => setViewportWidth(window.innerWidth)
    updateWidth()
    window.addEventListener("resize", updateWidth)
    return () => window.removeEventListener("resize", updateWidth)
  }, [])

  useEffect(() => {
    const previousOverscroll = document.documentElement.style.overscrollBehaviorX
    document.documentElement.style.overscrollBehaviorX = "none"
    const preventHistorySwipe = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY) && event.cancelable) event.preventDefault()
    }
    window.addEventListener("wheel", preventHistorySwipe, { capture: true, passive: false })
    return () => {
      document.documentElement.style.overscrollBehaviorX = previousOverscroll
      window.removeEventListener("wheel", preventHistorySwipe, true)
    }
  }, [])

  useEffect(() => {
    const carousel = carouselRef.current
    if (!carousel || products.length < 2) return
    let accumulatedX = 0
    let lastWheelAt = 0
    let movedDirection = 0
    let reverseDistance = 0
    let previousMagnitude = 0
    let sawSlowdown = false
    let lastMoveAt = 0
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return
      event.preventDefault()
      const now = Date.now()
      const magnitude = Math.abs(event.deltaX)
      if (now - lastWheelAt > 90) {
        accumulatedX = 0
        movedDirection = 0
        reverseDistance = 0
        sawSlowdown = false
      }
      lastWheelAt = now
      const direction = Math.sign(event.deltaX)
      if (movedDirection) {
        if (direction === movedDirection) {
          if (magnitude < 10) sawSlowdown = true
          if (sawSlowdown && now - lastMoveAt > 100 && magnitude > Math.max(12, previousMagnitude * 1.5)) {
            movedDirection = 0
            accumulatedX = event.deltaX
            sawSlowdown = false
          }
          reverseDistance = 0
          previousMagnitude = magnitude
          return
        }
        reverseDistance += Math.abs(event.deltaX)
        previousMagnitude = magnitude
        if (reverseDistance < 45) return
        setSelectedIndex((current) => (current + direction + products.length) % products.length)
        movedDirection = direction
        reverseDistance = 0
        lastMoveAt = now
        return
      }
      if (direction !== Math.sign(accumulatedX)) accumulatedX = 0
      accumulatedX += event.deltaX
      previousMagnitude = magnitude
      if (Math.abs(accumulatedX) < 35) return
      setSelectedIndex((current) => (current + direction + products.length) % products.length)
      movedDirection = direction
      lastMoveAt = now
    }
    carousel.addEventListener("wheel", onWheel, { passive: false })
    return () => carousel.removeEventListener("wheel", onWheel)
  }, [products.length])

  useEffect(() => {
    if (products.length < 2) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && ["INPUT", "SELECT", "TEXTAREA"].includes(event.target.tagName)) return
      if (event.key === "ArrowLeft") setSelectedIndex((current) => (current - 1 + products.length) % products.length)
      if (event.key === "ArrowRight") setSelectedIndex((current) => (current + 1) % products.length)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [products.length])

  const move = (direction: number) => setSelectedIndex((current) => (current + direction + products.length) % products.length)

  return (
    <section ref={carouselRef} className="flex flex-1 flex-col justify-center" aria-label={label}>
      <div className="relative w-full" style={{ height: Math.max(360, cardWidth * 1.25 + 80) }}>
        {products.map((product, index) => {
          const offset = relativeIndex(index, activeIndex, products.length)
          if (Math.abs(offset) > 2) return null
          const isSelected = offset === 0
          return (
            <motion.button key={product.id} type="button" aria-label={`${product.name}${isSelected ? ", selected" : ", select item"}`} aria-pressed={isSelected} onClick={() => setSelectedIndex(index)} className="absolute top-1/2 block cursor-pointer bg-white p-2 shadow-[0_16px_38px_rgba(0,0,0,0.18)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground sm:p-3" style={{ left: "50%", width: cardWidth, zIndex: 10 - Math.abs(offset) }} initial={false} animate={{ x: offset * cardStep - cardWidth / 2, y: "-50%", rotate: cardRotation(offset), scale: isSelected ? 1 : 0.82 }} transition={{ duration: reduceMotion ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}>
              <span className="relative block aspect-[4/5] overflow-hidden bg-[#eeece8]">
                {(product.hostedImageUrl || product.imageUrl) && <Image src={product.hostedImageUrl ? `/api/sale-images/${product.id}` : product.imageUrl!} alt={product.name} fill unoptimized sizes="(max-width: 640px) 190px, 400px" className="object-cover" />}
              </span>
            </motion.button>
          )
        })}
      </div>
      <div className="mx-auto mt-5 flex w-full max-w-3xl items-center justify-between gap-4 px-5 pb-8 sm:mt-8 sm:px-0">
        <button type="button" onClick={() => move(-1)} disabled={products.length < 2} aria-label="Previous item" className="flex size-11 shrink-0 items-center justify-center border border-foreground/25 transition-colors hover:bg-foreground hover:text-background disabled:opacity-40"><ArrowLeft aria-hidden="true" className="size-5" /></button>
        <div className="min-w-0 text-center" aria-live="polite">
          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {eyebrow ? eyebrow(activeProduct, activeIndex, products.length) : <span>{activeProduct.source.replaceAll("_", " ")}</span>}
            <span aria-hidden="true">·</span>
            <span>{activeIndex + 1} / {products.length}</span>
          </div>
          <h2 className="mt-2 line-clamp-2 text-lg font-medium leading-tight sm:text-2xl">{activeProduct.name}</h2>
          <p className="mt-2 flex items-center justify-center gap-3 text-base"><span className="font-semibold">${activeProduct.currentPrice}</span>{activeProduct.originalPrice && <span className="text-muted-foreground line-through">${activeProduct.originalPrice}</span>}</p>
          {activeProduct.reason && <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{activeProduct.reason}</p>}
          <a href={activeProduct.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block border-b border-current pb-0.5 text-sm font-medium">View item</a>
          {extraAction?.(activeProduct)}
        </div>
        <button type="button" onClick={() => move(1)} disabled={products.length < 2} aria-label="Next item" className="flex size-11 shrink-0 items-center justify-center border border-foreground/25 transition-colors hover:bg-foreground hover:text-background disabled:opacity-40"><ArrowRight aria-hidden="true" className="size-5" /></button>
      </div>
    </section>
  )
}
