import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { Queue } from 'bullmq';
import { auth } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await auth.api.getSession({
      headers: await headers() // Passes cookies/tokens automatically
  })

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized. Please sign in." },
      { status: 401 }
    )
  }

  const myQueue = new Queue('shopper');
  const body = await request.json(); // Read incoming JSON body
  const { queueName, brand } = body;
  await myQueue.add(queueName, { brand: brand });
  return NextResponse.json({ received: body }, { status: 201 });
}
