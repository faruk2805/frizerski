import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const { email, password, name, phone } = await req.json()

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        phone,
        passwordHash: hashedPassword,
        role: 'CLIENT',
      },
    })

    return NextResponse.json({ message: 'User registered', id: newUser.id })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
