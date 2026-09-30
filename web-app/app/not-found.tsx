import Image from "next/image"
import Link from "next/link"

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col bg-[#faf9f6] text-foreground">
      <header className="flex justify-center px-5 py-7 sm:px-10 sm:py-9">
        <Link href="/" aria-label="Cleo’s Collection home">
          <Image src="/cleos-collection-logo.png" alt="Cleo’s Collection" width={1113} height={130} priority className="h-auto w-44 sm:w-72" />
        </Link>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-5 pb-24 text-center sm:px-10">
        <h1 className="sr-only">This page doesn’t exist</h1>
        <Image src="/doesnt-exist.png" alt="This Page Doesn’t Exist" width={1234} height={130} priority className="h-auto w-full max-w-5xl" />
        <p className="mt-10 max-w-md text-sm leading-7 text-muted-foreground sm:text-base">Looks like this page is out of the collection.</p>
        <Link href="/dashboard" className="mt-8 inline-flex min-h-12 items-center justify-center bg-foreground px-7 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
          Back to the collection
        </Link>
      </section>
    </main>
  )
}
