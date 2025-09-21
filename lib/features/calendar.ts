import { AuthManager } from "../authentication/auth.js";
import { IAuthToken, ICalendarEventProp } from "../interfaces.js";
import path from "path";
import { promises as fs } from "fs";
import apiFetch from "../utils/fetcher.js";
import { format } from "date-fns";


type findFreeTimeslotsProps = {
    eventId: string; options?: null
} | {
    eventId?: null; options: { duration: number, startDate: string, startTime?: string, endTime?: string, weekDays?: string[] }
}


export class CalendarManager {
    private authBearerToken: IAuthToken;
    
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
            
            return response.event;
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
    async findFreeTimeslots(profCalendarId: string, studentCalendarId: string, params: findFreeTimeslotsProps): Promise<{ eventDurationHours: number, totalTimeslots: number, availableTimes: { start: string, end: string } }> {
        try {
            // Get selected event
            let eventStart: Date;
            let eventEnd: Date;
            let eventDurationHours: number;
            
            if (params.eventId) {
                const event = await this.getCalendarEvent(profCalendarId, params.eventId);
                if (!event) throw new Error("Event not found");
                eventStart = new Date(event.start_dt);
                eventEnd = new Date(event.end_dt);
                eventDurationHours = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60 * 60);
            } else if (params.options) {
                eventStart = new Date(params.options.startDate);
                eventDurationHours = params.options.duration;
            } else {
                throw new Error("Either eventId or options must be passed as params")
            }



            // Get 90 days range starting from the specified event's start date
            const startDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 90);

            
            // Fetch all events in the given period (90 days)
            // Custom formatLocalDate to ignore the timezone conversions
            const profEvents = await this.getCalendarEvents(
                profCalendarId,
                format(startDate, "yyyy-MM-dd"),
                format(endDate, "yyyy-MM-dd"),
            );
            
            let studentEvents: ICalendarEventProp[] = await this.getCalendarEvents(
                studentCalendarId,
                format(startDate, "yyyy-MM-dd"),
                format(endDate, "yyyy-MM-dd"),
            );
            
            // Convert events to time ranges
            const events = [...profEvents, ...studentEvents]
                .map(e => ({
                    start: new Date(e.start_dt),
                    end: new Date(e.end_dt)
                }))

            let availableTimes: { start: string; end: string }[] = [];

            let current = new Date(startDate);

            while (current <= endDate) {
                const dayStart = new Date(current);
                dayStart.setHours(8, 0, 0, 0);

                const dayEnd = new Date(current);
                dayEnd.setHours(20, 0, 0, 0);

                // Get events for this day within working hours
                const dayEvents = events.filter(e => e.start < dayEnd && e.end > dayStart);

                let lastEnd = new Date(dayStart);

                // Check gaps between events
                for (const e of dayEvents) {
                    const startBound = e.start < dayStart ? dayStart : e.start;
                    const endBound = e.end > dayEnd ? dayEnd : e.end;

                    const gapHours = (startBound.getTime() - lastEnd.getTime()) / (1000 * 60 * 60);
                    if (gapHours >= eventDurationHours) {
                        availableTimes.push({
                            start: format(lastEnd, "yyyy-MM-dd HH:mm:SS"),
                            end: format(startBound, "yyyy-MM-dd HH:mm:SS"),
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
                        start: format(lastEnd, "yyyy-MM-dd HH:mm:SS"),
                        end: format(dayEnd, "yyyy-MM-dd HH:mm:SS")
                    });
                }

                // Move to next day
                current.setDate(current.getDate() + 1);
            }
            
            // Check if paramaters are passed and apply them
            if (params.options) {
                let startTime = params.options.startTime ?? "08:00";
                let endTime = params.options.endTime ?? "20:00";
                let weekDays = params.options.weekDays ?? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                availableTimes = availableTimes.filter(at => weekDays.includes(format(new Date(at.start), "EEE")))
                .filter(at => {
                    const [startHour, startMinute] = startTime.split(":").map(Number);
                    const [endHour, endMinute] = endTime.split(":").map(Number);

                    const slotStart = new Date(at.start);
                    const slotEnd = new Date(at.end);

                    const startDate = new Date(slotStart);
                    const endDate = new Date(slotEnd);

                    startDate.setHours(startHour, startMinute);
                    endDate.setHours(endHour, endMinute);

                    return slotStart >= startDate && slotEnd <= endDate;
                });
            };

            const totalTimeslots = availableTimes.length;
            
            return {eventDurationHours, totalTimeslots, availableTimes};
        } catch (error) {
            console.error("Error finding free time weekly:", error);
            return [];
        }
    }

}