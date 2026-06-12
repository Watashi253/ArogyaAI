import express from 'express'
import * as authService from '../services/auth.service.js'

const router = express.Router()

router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body
    const tokens = await authService.signup(email, password, name)
    res.json(tokens)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const tokens = await authService.login(email, password)
    res.json(tokens)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

export default router