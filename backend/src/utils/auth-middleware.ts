import { Request, Response, NextFunction } from "express";


export default function authorize(req: Request, res: Response, next: NextFunction) {
    if (!req.session.apiKey) return res.status(401).json({ error: "API key is missing. Please login first" });

    next();
}