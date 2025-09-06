import { Router } from "express";
import { promises as fs } from "fs";
import path from "path";
import { LocalCalendar } from "../../lib/dist/teamup-lib";


const jsonRouter = Router();
const calendar = new LocalCalendar();


jsonRouter.get("/calendar/:calId/events", async (req, res) => {
    const calendarId = req.params.calId;
    const startDate = req.query.start || "2024-01-01";
    const endDate = req.query.end || "2026-01-01";
    try {
        const filename = `${calendarId}_${startDate}_${endDate}_events.json`
        console.log(filename);
        const events = await calendar.getEvents(filename);
        console.log(events);
        
        res.send(events);
    } catch (error) {
        res.status(500).json({error});
    }
});

jsonRouter.get("/calendar/:calId/events/:evId", async (req, res) => {
    const calendarId = req.params.calId;
    const eventId = req.params.evId;
    const startDate = req.query.start || "2024-01-01";
    const endDate = req.query.end || "2026-01-01";
    try {
        const filename = `${calendarId}_${startDate}_${endDate}_events.json`

        const event = await calendar.getEvent(filename, eventId);

        res.send(event);
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unkown error";
        res.status(500).json({ error: msg });
    }
});

jsonRouter.get("/calendar/:calId/events/:evId/patch", async (req, res) => {
    const calendarId = req.params.calId;
    const eventId = req.params.evId;
    const startDate = req.query.start || "2024-01-01";
    const endDate = req.query.end || "2026-01-01";
    
    try {
        const filename = `${calendarId}_${startDate}_${endDate}_events.json`
        const event = await calendar.editEvent(filename, eventId, [{
            who: "Salam Aleykum"
        }]);

        res.send(event);
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unkown error";
        res.status(500).json({ error: msg });
    }
});


export default jsonRouter;