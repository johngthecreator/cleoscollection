"use client"

import { authClient } from "@/lib/auth-client"

export default function SignInButton() {
  return (
      <button onClick={() => authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" })}>
        Sign in with Google
      </button>
  );
}
