import jwt from 'jsonwebtoken'

export function authenticate(req, res, next) {
  const token = req.cookies.accessToken

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized'
    })
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET
    )

    req.userId = payload.userId

    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token has expired'
      })
    }

    return res.status(401).json({
      error: 'Invalid token'
    })
  }
}