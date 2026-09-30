import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { salesTable } from '@/db/schema'
import { eq, and } from 'drizzle-orm';

export async function GET(request: Request) {
  const session = await auth.api.getSession({
      headers: await headers() // Passes cookies/tokens automatically
  })

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized. Please sign in." },
      { status: 401 }
    )
  }

  const brand = new URL(request.url).searchParams.get("brand") ?? "nike"
  const department = session.user.department
  if (!department) return NextResponse.json({ error: "Department is required." }, { status: 400 })

  const sales = await db.select().from(salesTable).where(and(
    eq(salesTable.source, brand),
    eq(salesTable.department, department),
    eq(salesTable.isActive, true),
  ))

  return NextResponse.json(sales);
}
