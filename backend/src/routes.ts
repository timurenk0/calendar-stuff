import { Router } from "express";
import authorize from "./utils/auth-middleware";
import { AuthManager, CalendarManager } from "../../lib/dist/teamup-lib";


const router = Router();
let auth: AuthManager;
let calendar: CalendarManager;


router.get("/health", (req, res) => {
    res.send("API is running...");
});

router.get("/auth/me", (req, res) => {
    const isAuthenticated = !!req.session.apiKey;
    res.json({ isAuthenticated });
})

router.post("/auth", async (req, res) => {
    const { api_key } = req.body;
    if (!api_key) return res.status(400).json({ error: "No API key provided" });

    try {
        req.session.apiKey = api_key;
        auth = new AuthManager(api_key);

        const response = await auth.authenticate();

        if (!response.ok) return res.status(401).json({ error: "Invalid API key" });

        calendar = new CalendarManager(auth);
        
        const data = await response.json();
        return res.json({ message: "API key saved", userInfo: data });        
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ error: `Failed to fetch API health: ${msg}` })
    }
});

router.get("/calendar/:id/config", authorize, async (req, res) => {
    const calendarId = req.params.id;
    try {
        const config = await calendar.getCalendarConfig(calendarId);

        res.send(config);        
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ error: `Failed to fetch calendar configuration: ${msg}` });
    }
});

// router.get("/calendar/keys", authorize, async (req, res) => {
//     try {
//         const response = await calendar.getCalendarKeys("kstoem2e1bvp4nc4j8");

//         if (!response.ok) throw new Error("Fetch request failed");

//         const data = await response.json();
//         res.json(data);
//     } catch (error) {
//         const msg = error instanceof Error ? error.message : "Unknown error";
//         res.status(500).json({ error: msg });
//     }
// })



router.get("/calendar/:calId/events", authorize, async (req, res) => {
    const calendarId = req.params.calId;
    try {
        const startDate = req.query.start || "2024-01-01";
        const endDate = req.query.end || "2026-01-01";
        const events = await calendar.getCalendarEvents(calendarId, String(startDate), String(endDate));

        res.send(events);
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unkown error";
        res.status(500).json({ error: `Failed to fetch calendar events" ${msg}` });
    }
});

router.get("/calendar/:calId/events/:id", authorize, async (req, res) => {
    const calendarId = req.params.calId;
    const eventId = req.params.id;
    try {
        
        const event = await calendar.getCalendarEvent(calendarId, eventId);
        const availableTimes = await calendar.findFreeTimeslots(calendarId, "kstoem2e1bvp4nc4j8", {eventId});
        
        res.send([event, availableTimes]);
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unkown error";
        res.status(500).json({ error: `Failed to fetch calendar events" ${msg}` });
    }
});

router.get("/calendar/:calId/schedule-event", authorize, async (req, res) => {
    const calendarId = req.params.calId;
    try {
        const schedule = await calendar.findFreeTimeslots(calendarId, "kstoem2e1bvp4nc4j8", {
            options: {
                duration: 3,
                startDate: "2025-01-01",
                weekDays: ["Mon", "Tue", "Fri"],
                startTime: "10:00"
            }
        });

        res.send(schedule);
    } catch (error) {
        res.status(500).json({ error: `Failed to schedule event: ${error}` });
    }
})

router.get("/calendar/:calId/subcalendars", authorize, async (req, res) => {
    const calendarId = req.params.calId;
    try {
        const response = await calendar.getSubCalendars(calendarId);

        if (!response.ok) throw new Error("Fetch request failed");

        const data = await response.json();
        res.json({ data });
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ error: `Failed to fetch subcalendars: ${msg}` });
    }
});

router.get("/calendar/:calId/subcalendars/:subCalId", authorize, async (req, res) => {
    const calendarId = req.params.calId;
    const subCalendarId = req.params.subCalId;
    try {
        const response = await calendar.getSubCalendar(calendarId, subCalendarId);

        if (!response.ok) throw new Error("Fetch request failed");

        const data = await response.json();
        res.json(data);
    } catch (error) {
        
    }
})

router.get("/calendar/:calId/save", authorize,  async (req, res) => {
    const calendarId = req.params.calId;
    const startDate = req.query.start || "2024-01-01";
    const endDate = req.query.end || "2026-01-01";
    try {
        const events = await calendar.saveCalendar(calendarId, String(startDate), String(endDate), "C:\\output");

        res.json({ success: true, savedData: events });        
    } catch (error: any) {
        throw new Error(error.message);
    }
});



export default router;