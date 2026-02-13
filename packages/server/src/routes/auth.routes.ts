import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { generateAccessToken, generateRefreshToken, authMiddleware, type AuthPayload } from '../middleware/auth.js';

const router = Router();

// In-memory users for mock mode (replaced by DB in production)
const MOCK_USERS = [
  {
    id: 1,
    tenantId: 1,
    email: 'admin@manna.digital',
    passwordHash: bcrypt.hashSync('admin123', 10),
    fullName: 'Admin Manna',
    role: 'admin',
  },
  {
    id: 2,
    tenantId: 1,
    email: 'analyst@manna.digital',
    passwordHash: bcrypt.hashSync('analyst123', 10),
    fullName: 'Analyst Manna',
    role: 'analyst',
  },
];

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }

  const user = MOCK_USERS.find(u => u.email === email);
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const payload: AuthPayload = {
    userId: user.id,
    tenantId: user.tenantId,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      tenantId: user.tenantId,
    },
  });
});

router.post('/refresh', (req: Request, res: Response): void => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token required' });
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, env.jwtRefreshSecret) as AuthPayload;
    const newAccessToken = generateAccessToken({
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      email: decoded.email,
      role: decoded.role,
    });
    res.json({ accessToken: newAccessToken });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.get('/me', authMiddleware, (req: Request, res: Response): void => {
  const user = MOCK_USERS.find(u => u.id === req.user!.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    tenantId: user.tenantId,
  });
});

export default router;
