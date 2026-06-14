import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../config/db.js'

export async function signup(email, password, name) {
  const existing = await prisma.user.findUnique({
    where: { email }
  })

  if (existing) {
    throw new Error('Email already registered')
  }

  const passwordHash = await bcrypt.hash(
    password,
    12
  )

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name
    }
  })

  return generateTokens(user.id)
}

export async function login(email, password) {
  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    throw new Error('Invalid email or password')
  }

  const valid = await bcrypt.compare(
    password,
    user.passwordHash
  )

  if (!valid) {
    throw new Error('Invalid email or password')
  }

  return generateTokens(user.id)
}

function generateTokens(userId) {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    {
      expiresIn: '30m'
    }
  )

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: '7d'
    }
  )

  return {
    accessToken,
    refreshToken
  }
}

export async function refreshAccessToken(
  refreshToken
) {
  try {
    const payload = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    )

    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId
      }
    })

    if (!user) {
      throw new Error('User not found')
    }

    const accessToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      {
        expiresIn: '30m'
      }
    )

    return { accessToken }
  } catch {
    throw new Error('Invalid refresh token')
  }
}