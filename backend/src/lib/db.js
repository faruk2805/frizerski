import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { NextResponse } from 'next/server'

export const prisma = new PrismaClient().$extends(withAccelerate())

export async function GET() {
  const users = await prisma.user.findMany()
  return NextResponse.json(users)
}
