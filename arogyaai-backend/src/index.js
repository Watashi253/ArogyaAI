import express from 'express'
import cors from 'cors'

import authRoutes from './routes/auth.routes.js'
import userRoutes from './routes/user.routes.js'
import nutritionRoutes from './routes/nutrition.routes.js'
import sleepRoutes from './routes/sleep.routes.js'
import waterRoutes from './routes/water.routes.js'
import activityRoutes from './routes/activity.routes.js'
import medicineRoutes from './routes/medicine.routes.js'
import recordsRoutes from './routes/records.routes.js'
import healthRoutes from './routes/health.routes.js'

import { errorHandler, notFound } from './middleware/errorHandler.js'

const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (req, res) => {
  res.json({ message: 'Server is running' })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/nutrition', nutritionRoutes)
app.use('/api/sleep', sleepRoutes)
app.use('/api/water', waterRoutes)
app.use('/api/activity', activityRoutes)
app.use('/api/medicines', medicineRoutes)
app.use('/api/records', recordsRoutes)
app.use('/api/health', healthRoutes)

// Error handlers
app.use(notFound)
app.use(errorHandler)

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})