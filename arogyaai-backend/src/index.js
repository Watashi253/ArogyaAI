import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.routes.js'
import userRoutes from './routes/user.routes.js'

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)

app.get('/health', (req, res) => {
  res.json({ message: 'Server is running' })
})

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})
