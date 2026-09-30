import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

const steps = [
  { number: "01", title: "Tell us your taste", description: "A few thoughtful questions help us get to know the pieces you love and the way you like to dress." },
  { number: "02", title: "Explore the weekly edit", description: "Each week, we pick standout pieces from current sales with your style in mind." },
  { number: "03", title: "Make it yours", description: "Follow the details, find similar styles, and shop when something catches your eye." },
]

export default function Home() {
  return (
    <main className="min-h-dvh bg-[#faf9f6] text-foreground">
      <header className="absolute inset-x-0 top-0 z-10 mx-auto flex w-full max-w-7xl justify-center px-5 py-7 sm:px-10 sm:py-9">
        <Link href="/" aria-label="Cleo’s Collection home">
          <Image src="/cleos-collection-logo-white.png" alt="Cleo’s Collection" width={1113} height={130} priority className="h-auto w-44 sm:w-72" />
        </Link>
      </header>

      <section className="relative isolate flex min-h-[680px] flex-col items-center justify-center overflow-hidden px-5 py-28 text-center text-white sm:min-h-[760px] sm:px-10 sm:py-36">
        <Image src="/cloud-background.webp" alt="" fill priority sizes="100vw" className="-z-20 object-cover object-center" />
        <div className="absolute inset-0 -z-10 bg-slate-950/55" />
        <h1 className="max-w-5xl text-[clamp(4rem,8.5vw,7.75rem)] font-normal leading-[0.88] tracking-[-0.045em]" style={{ fontFamily: "var(--font-cormorant-garamond), serif" }}>Find what <span className="italic">feels</span> <span className="whitespace-nowrap">like you.</span></h1>
        <p className="mt-10 max-w-xl text-base leading-8 text-white/90 sm:text-lg">Every week, we curate pieces from the best sales for your style. Look good, find something you love, and spend a little less.</p>
        <Link href="/login" className="group mt-9 inline-flex min-h-12 items-center gap-8 bg-[#faf9f6] px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-white">
          Explore the collection <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </section>
      <section id="how-it-works" className="border-y border-foreground/15 bg-white/50">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-10 sm:py-28">
          <div className="mb-14 flex flex-col justify-between gap-5 sm:mb-20 sm:flex-row sm:items-end">
            <div><p className="mb-4 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">How it works</p><h2 className="max-w-xl text-5xl leading-[0.95] sm:text-7xl" style={{ fontFamily: "var(--font-cormorant-garamond), serif" }}>A little more you,<br /><span className="italic">in every find.</span></h2></div>
            <p className="max-w-xs text-sm leading-7 text-muted-foreground">Weekly sale finds chosen for your taste, so looking great can cost less.</p>
          </div>
          <div className="grid border-t border-foreground/15 md:grid-cols-3">
            {steps.map((step) => <div key={step.number} className="border-b border-foreground/15 py-8 md:border-b-0 md:pr-9 md:py-10 md:[&+div]:border-l md:[&+div]:pl-9">
              <span className="text-xs tabular-nums tracking-[0.2em] text-muted-foreground">{step.number} / 03</span>
              <h3 className="mt-12 text-3xl leading-none sm:text-4xl" style={{ fontFamily: "var(--font-cormorant-garamond), serif" }}>{step.title}</h3>
              <p className="mt-4 max-w-sm text-sm leading-7 text-muted-foreground">{step.description}</p>
            </div>)}
          </div>
        </div>
      </section>
      <footer className="border-t border-foreground/15 px-5 py-7 sm:px-10"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center"><Image src="/cleos-collection-logo.png" alt="Cleo’s Collection" width={1113} height={130} className="h-auto w-40" /><span>Find what feels like you.</span></div></footer>
    </main>
  )
}
