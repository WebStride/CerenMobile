import express, {Request, Response} from  "express";
import cors from "cors";
import dotenv from 'dotenv';
// import routes from "./routes";
dotenv.config();
import routes from "./routes.js";

const app = express();

console.log("cors enabled")

app.use(cors({
  origin: '*', // Allow only your frontend origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed HTTP methods
  credentials: true // Set to true if the frontend uses cookies/auth headers
}));

app.use(express.json());


const port = parseInt(process.env.PORT || '3002');

const host = process.env.HOST || '0.0.0.0';



app.listen(port, host, async () => {
    console.log(`App is running at port: http://${host}:${port}`);
    await routes(app);
  });


export default app;