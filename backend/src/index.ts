import express from "express";
import cors from "cors";
import session from "express-session";
import router from "./routes";
import jsonRouter from "./json-routes"


const app = express();
app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
}));
app.use(session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 60 * 60 * 1000 }
}));
app.use("/api", router);
app.use("/json-api", jsonRouter);

app.listen(3999, () => console.log("Server is running on port 3999..."));


