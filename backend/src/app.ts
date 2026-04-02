import express, {Request, Response} from  "express";
import cors from "cors";
import compression from 'compression';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const MSG91_PLACEHOLDER_VALUES = new Set([
  'msg91_auth_key',
  'msg91_template_id',
  'msg91_api_key',
  'your_dev_msg91_key',
  'your_dev_template_id',
  'your_prod_msg91_key',
  'your_prod_template_id',
]);

function shouldSkipEnvOverride(key: string, value: string): boolean {
  if (!['MSG91_AUTH_KEY', 'MSG91_TEMPLATE_ID', 'MSG91_API_KEY'].includes(key)) {
    return false;
  }

  return MSG91_PLACEHOLDER_VALUES.has(value.trim().toLowerCase());
}

function loadEnvFile(filePath: string, sourceLabel: string, overrideExisting: boolean) {
  const parsed = dotenv.parse(fs.readFileSync(filePath));

  Object.entries(parsed).forEach(([key, value]) => {
    if (shouldSkipEnvOverride(key, value)) {
      console.warn(`⚠️  Skipping placeholder ${key} from ${sourceLabel}; keeping existing value.`);
      return;
    }

    if (overrideExisting || process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

// Load environment variables based on NODE_ENV
const nodeEnv = (process.env.NODE_ENV || 'development').trim();
const defaultEnvPath = path.resolve(process.cwd(), '.env');
const envPath = path.resolve(process.cwd(), `.env.${nodeEnv}`);

if (fs.existsSync(defaultEnvPath)) {
  console.log('🛠️  Loading default .env file');
  loadEnvFile(defaultEnvPath, '.env', false);
}

if (fs.existsSync(envPath)) {
  console.log(`🛠️  Loading env file: ${envPath}`);
  loadEnvFile(envPath, `.env.${nodeEnv}`, true);
} else if (!fs.existsSync(defaultEnvPath)) {
  console.warn(`⚠️  No .env file found for NODE_ENV=${nodeEnv}. Falling back to process env values.`);
}

const routes = require('./routes').default;

const app = express();

console.log("cors enabled")

app.use(cors({
  origin: '*', // Allow only your frontend origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed HTTP methods
  credentials: true // Set to true if the frontend uses cookies/auth headers
}));

// Gzip all responses — reduces JSON payload ~80-90% over internet connections
app.use(compression());

app.use(express.json());

// Simple request timing middleware to log response durations
app.use((req: any, res: any, next: any) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} ${ms}ms`);
  });
  next();
});

// Health endpoint for quick reachability and latency checks
app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, now: new Date().toISOString() });
});


const port = parseInt(process.env.PORT || '3002');

const host = process.env.HOST || '0.0.0.0';



// Register routes before starting the server — avoids race-condition 404s on startup
routes(app);

// Fix Node.js (5s default) vs Nginx (65s) keepAlive mismatch.
// Without this, Node closes keep-alive connections before Nginx does, causing
// ECONNRESET + TCP+TLS retry on random requests (~150-400ms penalty each).
const server = app.listen(port, host, () => {
    console.log(`App is running at port: http://${host}:${port}`);
  });

server.keepAliveTimeout = 65000;  // must exceed Nginx keepalive_timeout (65s)
server.headersTimeout  = 66000;   // must be > keepAliveTimeout

export default app;