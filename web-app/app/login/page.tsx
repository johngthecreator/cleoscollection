"use client"

import Image from "next/image";
import Link from "next/link";
import SignInButton from "@/components/ui/SignInButton";

export default function LoginPage() {
  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: "url('/cloud-background.webp')" }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-slate-950/35"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-950/20 via-transparent to-slate-950/40"
      />

      <div className="relative flex w-full max-w-md flex-col items-center gap-8">
        <header className="flex w-full justify-center pb-2">
          <Link href="/" aria-label="Cleo’s Collection home">
            <Image src="/cleos-collection-logo-white.png" alt="Cleo’s Collection" width={1113} height={130} priority className="h-auto w-72 sm:w-96" />
          </Link>
        </header>

        <SignInButton />
      </div>
    </main>
  );
}
