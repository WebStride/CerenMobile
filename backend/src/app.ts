import express, {Request, Response} from  "express";
import cors from "cors";
import dotenv from 'dotenv';
// import routes from "./routes";
dotenv.config();
import routes from "./routes";

const app = express();

console.log("cors enabled")

app.use(cors({
  origin: '*', // Allow only your frontend origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed HTTP methods
  credentials: true // Set to true if the frontend uses cookies/auth headers
}));

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



app.listen(port, host, async () => {
    console.log(`App is running at port: http://${host}:${port}`);
    await routes(app);
  });


export default app;