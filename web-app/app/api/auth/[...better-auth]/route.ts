import { auth } from "@/lib/auth" // Imports your Step 1 engine
import { toNextJsHandler } from "better-auth/next-js"

export const { GET, POST } = toNextJsHandler(auth)
