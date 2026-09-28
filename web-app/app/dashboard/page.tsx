'use client'

import SignOutButton from "@/components/ui/SignOutButton"
import { authClient } from "@/lib/auth-client"
import axios from "axios"

export default function Dashboard() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return <h2>Loading...</h2>
  }

  if (!session) {
    return <p className="text-gray-500">Not signed in</p>
  }

  const getData = async () => {
    await axios.post("/api/chat",{
      queueName: "john",
      brand: "Nike"
    })
  }

  return (
      <div className="p-8">
          <h1>Welcome to your Dashboard, {session.user.name}!</h1>
          <p>Email: {session.user.email}</p>
      <button onClick={getData}>Get Data</button>
          <SignOutButton />
      </div>
  )
}
