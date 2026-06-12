import jwt from 'jsonwebtoken'

export function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  try {
    const payload = jwt.verify(token, 'secret_key_change_this')
    req.userId = payload.userId
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}