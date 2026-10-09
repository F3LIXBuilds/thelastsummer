import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import auth from './routes/auth.js';
import profile from './routes/profile.js';
import stories from './routes/stories.js';
import progress from './routes/progress.js';
import admin from './routes/admin.js';
import media from './routes/media.js';
import backgrounds from './routes/backgrounds.js';
import { errorHandler } from './middleware/http.js';

if (!process.env.DATABASE_URL || (process.env.JWT_SECRET ?? '').length < 32) {
  console.error('Missing DATABASE_URL or JWT_SECRET (32+ chars) in server/.env');
  process.exit(1);
}

const app = express();
app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
    },
  },
}));
app.use('/api/admin/media', express.json({ limit: '3mb' })); // image uploads are base64
app.use(express.json({ limit: '512kb' }));                   // was 256kb; scripts can be long
app.use(cookieParser());
app.use('/api', rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: true, legacyHeaders: false }));
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60_000, limit: 40, standardHeaders: true, legacyHeaders: false }), auth);
app.use('/api/profile', profile);
app.use('/api/stories', stories);
app.use('/api/admin', admin);
app.use('/api/media', media);
app.use('/api/backgrounds', backgrounds);
app.use('/api', progress);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

if (process.env.NODE_ENV === 'production') {
  const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '../client/dist');
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use(errorHandler);
const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API on http://localhost:${port}`));
