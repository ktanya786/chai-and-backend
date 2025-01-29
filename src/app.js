import express, { json, urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  })
);

app.use(json({ limit: "16kb" })); // take upto 16kb json
app.use(urlencoded({ extended: true, limit: "16kb" })); // take url data and encode it, same limit and you can take embedded object
app.use(express.static("public")); // can store static file or something in public folder
app.use(cookieParser());

export { app };
