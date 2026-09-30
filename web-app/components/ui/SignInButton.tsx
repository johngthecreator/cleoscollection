"use client"

import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"

export default function EmailAuthForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") ?? "")
    const password = String(formData.get("password") ?? "")

    try {
      const result = isSignUp
        ? await authClient.signUp.email({
            name: String(formData.get("name") ?? ""),
            email,
            password,
            callbackURL: "/welcome",
          })
        : await authClient.signIn.email({
            email,
            password,
            callbackURL: "/dashboard",
          })

      if (result.error) {
        setError(result.error.message ?? "Unable to authenticate. Please try again.")
        return
      }

      window.location.assign(isSignUp ? "/welcome" : "/dashboard")
    } catch {
      setError("Unable to authenticate. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md rounded-none border-white/20 bg-slate-950/45 text-white shadow-2xl shadow-black/25 ring-white/15 backdrop-blur-xl">
      <CardContent className="pt-0">
        <form className="space-y-5" onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="grid gap-2">
              <Label className="text-white/90" htmlFor="auth-name">
                Name
              </Label>
              <Input
                className="rounded-none border-white/25 bg-white/5 text-white placeholder:text-white/45 focus-visible:border-white/60 focus-visible:ring-white/20"
                autoComplete="name"
                id="auth-name"
                name="name"
                required
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label className="text-white/90" htmlFor="auth-email">
              Email
            </Label>
            <Input
              className="rounded-none border-white/25 bg-white/5 text-white placeholder:text-white/45 focus-visible:border-white/60 focus-visible:ring-white/20"
              autoComplete="email"
              id="auth-email"
              name="email"
              placeholder="you@example.com"
              required
              type="email"
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-white/90" htmlFor="auth-password">
              Password
            </Label>
            <Input
              className="rounded-none border-white/25 bg-white/5 text-white placeholder:text-white/45 focus-visible:border-white/60 focus-visible:ring-white/20"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              id="auth-password"
              minLength={8}
              name="password"
              placeholder={isSignUp ? "At least 8 characters" : "Your password"}
              required
              type="password"
            />
          </div>

          {error && (
            <p
              className="rounded-md border border-rose-200/25 bg-rose-400/10 px-3 py-2 text-sm text-rose-100"
              role="alert"
            >
              {error}
            </p>
          )}

          <Button
            className="w-full rounded-none bg-white text-slate-950 hover:bg-white/90"
            disabled={isSubmitting}
            size="lg"
            type="submit"
          >
            {isSubmitting ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center gap-1 border-t border-white/15 bg-white/5 text-sm text-white/75">
        {isSignUp ? "Already have an account?" : "New to Cleo’s Collection?"}
        <Button
          className="h-auto px-1 font-semibold text-white hover:text-white/80"
          onClick={() => {
            setError("")
            setIsSignUp(!isSignUp)
          }}
          size="sm"
          variant="link"
          type="button"
        >
          {isSignUp ? "Sign in" : "Create an account"}
        </Button>
      </CardFooter>
    </Card>
  );
}
