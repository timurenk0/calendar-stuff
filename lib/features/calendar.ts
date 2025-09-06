import { AuthManager } from "../authentication/auth.js";
import { IAuthToken, ICalendarEventProp } from "../interfaces.js";
import { DateFormatter } from "../utils/date-converter.js";
import path from "path";
import { promises as fs } from "fs";
import apiFetch from "../utils/fetcher.js";

export class CalendarManager {
    private authBearerToken: IAuthToken;
    private df = new DateFormatter();
    
    constructor(auth: AuthManager) {
        this.authBearerToken = auth.getAuthHeader();
    }


    /**
     * Saves calendar configuration and events for the given date range into a JSON file.
     * @param calendarId TeamUp calendar ID
     * @param start Start date (YYYY-MM-DD)
     * @param end End date (YYYY-MM-DD)
     * @returns True if saved successfully
     * @throws Error if saving fails
     */
    async saveCalendar(calendarId: string, start: string, end: string): Promise<boolean> {
        try {
            // Fetch calendar configuration info and events for specified calendar.
            const calendar = await this.getCalendarConfig(calendarId);
            const events = await this.getCalendarEvents(calendarId, start, end);

            // Specify the link where all the calendar JSON files will be stored.
            const LINK = "C:\\Users\\timur.zheltenkov\\Documents\\calendar-stuff\\calendar-stuff\\json-output";
            
            // Create the output folder if it doesn't exist
            await fs.mkdir(LINK, 
                { recursive: true }
            );

            // Specify the final destination link with the output file name.
            // Organize the contents and write them to the file.
            const filePath = path.join(LINK, `${calendarId}_${start}_${end}_events.json`);
            const contents = {
                calendar_config: {
                    title: calendar.configuration.identity.title,
                    name: calendar.configuration.link.name,
                    id: calendar.configuration.link.id
                },
                events: {
                    ...events
                }
            }
            await fs.writeFile(filePath, JSON.stringify(contents, null, 2));

            return true;
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Unknown Error";
            throw new Error(`Failed to save calnedar: ${msg}`);
        }
    }
    
    async checkMazhar(eventId: string) {
        try {
            const response = await apiFetch(`https://api.teamup.com/ksh61p2d97npottv3o/events/${eventId}`, this.authBearerToken)

            return response.status;
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Unkown error";
            throw new Error(`Failed to check Mazhar: ${msg}`)
        }
    }

    /**
     * Retrieves configuration details for the specified calendar.
     * @param calendarId TeamUp calendar ID
     * @returns Calendar configuration object
     * @throws Error if request fails
     */
    async getCalendarConfig(calendarId: string) {
        try {
            const response = await apiFetch(`https://api.teamup.com/${calendarId}/configuration`, this.authBearerToken);

            return response;
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            throw new Error(`Failed to fetch calendar config: ${msg}`);
        }
    }

    /**
     * Retrieves all API keys for the specified calendar (requires special permissions).
     * @param calendarId TeamUp calendar ID
     * @returns something idfk
     * @throws Error if request fails
     */
    // still dunno wtf it does tbh
    async getCalendarKeys(calendarId: string) {
        try {
            const response = await apiFetch(`https://api.teamup.com/${calendarId}/keys`, this.authBearerToken)

            return response;
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Unknown Error";
            throw new Error(`Failed to fetch calendar keys: ${msg}`);
        }
    }
    
    /**
     * Retrieves all subcalendars for the given calendar.
     * @param calendarId TeamUp calendar ID
     * @returns List of sub-calendars
     * @throws Error if request fails
     */
    async getSubCalendars(calendarId: string) {
        try {
            const response = await apiFetch(`https://api.teamup.com/${calendarId}/subcalendars`, this.authBearerToken)

            return response;            
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            throw new Error(`Failed to fetch sub calendars: ${msg}`);
        }
    }

    /**
     * Retrieves details for a specific subcalendar.
     * @param calendarId TeamUp calendar ID
     * @param subCalendarId Subcalendar ID
     * @returns Sub-Calendar configuration object
     * @throws Error if request fails
     */
    async getSubCalendar(calendarId: string, subCalendarId: string) {
        try {
            const response = await apiFetch(`https://api.teamup.com/${calendarId}/subcalendars/${subCalendarId}`, this.authBearerToken)
            
            return response;
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            throw new Error(`Failed to fetch sub calendar: ${msg}`);
        }
    }
    
    /**
     * Retrieves all events for a given calendar within a specified date range.
     * @param calendarId TeamUp calendar ID
     * @param start Start date (YYYY-MM-DD)
     * @param end End date (YYYY-MM-DD)
     * @returns List of events
     * @throws Error if request fails
     */
    async getCalendarEvents(calendarId: string, start: string, end: string): Promise<ICalendarEventProp[]> {
        try {
            const response = await apiFetch(`https://api.teamup.com/${calendarId}/events?startDate=${start}&endDate=${end}`, this.authBearerToken)

            return response.events;
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Unknown message";
            throw new Error(`Failed to fetch calendar events: ${msg}`);
        }
    }

    /**
     * Retrieves details for a specific calendar event.
     * @param calendarId TeamUp calendar ID
     * @param eventId Event identifier
     * @returns Event details object
     * @throws Error if request fails
     */
    async getCalendarEvent(calendarId: string, eventId: string): Promise<ICalendarEventProp> {
        try {
            const response = await apiFetch(`https://api.teamup.com/${calendarId}/events/${eventId}`, this.authBearerToken)
            
            return response.events;
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Unknown message";
            throw new Error(`Failed to fetch calendar event: ${msg}`);
        }
    }

    /**
     * Finds available timeslots within 90 days for scheduling an event of the same duration as the given event.
     * Working hours are limited between 8:00–20:00.
     * @param calendarId TeamUp calendar ID
     * @param eventId Event identifier
     * @returns Event duration in hours and list of available times
     */
    async findFreeTimeslots(calendarId: string, eventId: string) {
        try {
            // Get selected event
            const event = await this.getCalendarEvent(calendarId, eventId);
            if (!event) throw new Error("Event not found");


            const eventStart = new Date(event.start_dt);
            const eventEnd = new Date(event.end_dt);
            const eventDurationHours = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60 * 60);

            // Get 90 days range starting from the event's date
            const startDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 90);

            
            // Fetch all events in the given period (90 days)
            // Custom formatLocalDate to ignore the timezone conversions
            const allEvents = await this.getCalendarEvents(
                calendarId,
                this.df.formatLocalDate(startDate),
                this.df.formatLocalDate(endDate)
            );

            console.log("allEvents:", allEvents);
            
            let mazharEvents: ICalendarEventProp[] = [];
            if (await this.checkMazhar(eventId) === 200) {
                const mazharData = await this.getCalendarEvents("ksh61p2d97npottv3o", this.df.formatLocalDate(startDate), this.df.formatLocalDate(endDate));
                if (!mazharData) throw new Error("Failed to fetch Mazhar events");
                mazharEvents = mazharData;
            }
            
            // Convert events to time ranges
            const events = [...allEvents, ...mazharEvents]
                .map((e: any) => ({
                    start: new Date(e.start_dt),
                    end: new Date(e.end_dt)
                }))

            const availableTimes: { start: string; end: string }[] = [];

            let current = new Date(startDate);

            while (current <= endDate) {
                const dayStart = new Date(current);
                dayStart.setHours(8, 0, 0, 0);

                const dayEnd = new Date(current);
                dayEnd.setHours(20, 0, 0, 0);

                // Get events for this day within working hours
                const dayEvents = events.filter((e: any) => e.start < dayEnd && e.end > dayStart);

                let lastEnd = new Date(dayStart);

                // Check gaps between events
                for (const e of dayEvents) {
                    const startBound = e.start < dayStart ? dayStart : e.start;
                    const endBound = e.end > dayEnd ? dayEnd : e.end;

                    const gapHours = (startBound.getTime() - lastEnd.getTime()) / (1000 * 60 * 60);
                    if (gapHours >= eventDurationHours) {
                        availableTimes.push({
                            start: this.df.formatLocalDateTime(lastEnd),
                            end: this.df.formatLocalDateTime(startBound)
                        });
                    }
                    if (endBound > lastEnd) {
                        lastEnd = new Date(endBound);
                    }
                }

                // Gap from last event to day end
                const finalGapHours = (dayEnd.getTime() - lastEnd.getTime()) / (1000 * 60 * 60);
                if (finalGapHours >= eventDurationHours) {
                    availableTimes.push({
                        start: this.df.formatLocalDateTime(lastEnd),
                        end: this.df.formatLocalDateTime(dayEnd)
                    });
                }

                // Move to next day
                current.setDate(current.getDate() + 1);
            }

            return {eventDurationHours, availableTimes};
        } catch (error) {
            console.error("Error finding free time weekly:", error);
            return [];
        }
    }
}