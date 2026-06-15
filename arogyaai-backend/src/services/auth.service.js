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
      expiresIn: '1h'
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
        expiresIn: '1h'
      }
    )

    return { accessToken }
  } catch {
    throw new Error('Invalid refresh token')
  }
}

export async function requestPasswordReset(email) {
  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    return { message: 'If that email exists, a reset link has been sent.' }
  }

  const resetToken = jwt.sign(
    { userId: user.id, purpose: 'password_reset' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  )

  const payload = {
    message: 'If that email exists, a reset link has been sent.'
  }

  if (process.env.NODE_ENV !== 'production') {
    payload.resetToken = resetToken
    payload.resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`
  }

  return payload
}

export async function resetPassword(token, newPassword) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters')
  }

  let payload
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    throw new Error('Invalid or expired reset link')
  }

  if (payload.purpose !== 'password_reset') {
    throw new Error('Invalid reset token')
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId }
  })

  if (!user) {
    throw new Error('User not found')
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash }
  })

  return { message: 'Password reset successful' }
}