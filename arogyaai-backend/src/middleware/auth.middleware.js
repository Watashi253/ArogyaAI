import jwt from 'jsonwebtoken'

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header provided' })
  }

  const [scheme, token] = authHeader.split(' ')
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authorization header must be in the format: Bearer <token>' })
  }

  try {
    const payload = jwt.verify(token, 'secret_key_change_this')
    req.userId = payload.userId
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired' })
    }

    return res.status(401).json({ error: 'Invalid token' })
  }
}