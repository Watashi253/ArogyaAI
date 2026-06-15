import express from 'express'
import * as authService from '../services/auth.service.js'

const router = express.Router()

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite:
  process.env.NODE_ENV === 'production'
      ? 'none'
      : 'lax'
}

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body

    const tokens = await authService.signup(
      email,
      password,
      name
    )

    res.cookie('accessToken', tokens.accessToken, {
      ...cookieOptions,
      maxAge: 1000 * 60 * 60 // 1 hour
    })

    res.cookie('refreshToken', tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    res.json({
      message: 'Signup successful'
    })
  } catch (error) {
    res.status(400).json({
      error: error.message
    })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    const tokens = await authService.login(
      email,
      password
    )

    res.cookie('accessToken', tokens.accessToken, {
      ...cookieOptions,
      maxAge: 1000 * 60 * 60 // 1 hour
    })

    res.cookie('refreshToken', tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    res.json({
      message: 'Login successful'
    })
  } catch (error) {
    res.status(400).json({
      error: error.message
    })
  }
})

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('accessToken')
  res.clearCookie('refreshToken')

  res.json({
    message: 'Logged out successfully'
  })
})

router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token missing'
      })
    }

    const tokens =
      await authService.refreshAccessToken(
        refreshToken
      )

    res.cookie(
      'accessToken', tokens.accessToken, {
        ...cookieOptions,
        maxAge: 1000 * 60 * 60 // 1 hour
      }
    )
  

    res.json({
      message: 'Token refreshed'
    })
  } catch (error) {
    res.status(401).json({
      error: error.message
    })
  }
})

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    const result = await authService.requestPasswordReset(email)
    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' })
    }

    const result = await authService.resetPassword(token, password)
    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

export default router