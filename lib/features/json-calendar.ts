import { promises as fs } from "fs";
import path from "path";
import { ICalendarEventProp, IFileProp } from "@lib/interfaces";


export class LocalCalendar {
    private DIR_PATH: string;
    // "C:\\Users\\timur.zheltenkov\\Documents\\calendar-stuff\\calendar-stuff\\json-output";
    
    /**
     * @param DIR_PATH Absolute path to the folder where you want to store JSON calendar files
     */
    constructor(DIR_PATH: string) {
        this.DIR_PATH = DIR_PATH;
    };


    /**
     * Verifies if a file exists in the calendar directory.
     * @param filename Name of the file to check.
     * @returns The resolved file path if found.
     * @throws Error if the file does not exist.
     */
    private async verifyFile(filename: string): Promise<string> {
        try {
            const filepath = path.join(this.DIR_PATH, filename);
            await fs.access(filepath);
            return filepath;
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            throw new Error(`Failed to find JSON file: ${msg}`);
        }
    }

    /**
     * Reads and parses a JSON file into an object.
     * @param filename Name of the file to read.
     * @returns Parsed JSON file contents.
     * @throws Error if the file cannot be read or parsed.
     */
    private async readFile(filepath: string): Promise<IFileProp> {
        try {
            const contents = JSON.parse(await fs.readFile(filepath, "utf-8"));

            return contents;            
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Unknown message";
            throw new Error(`Failed to read JSON file: ${msg}`);
        }
    }

    /**
     * Retrieves all events from a file and normalizes location values.
     * @param filename Name of the file containing events.
     * @returns List of calendar events.
     * @throws Error if events cannot be retrieved.
     */
    async getEvents(filename: string): Promise<any> {
        try {
            const filepath = await this.verifyFile(filename);
            const contents = await this.readFile(filepath);
            
            // normalizing location namings
            Object.values(contents.events).forEach((ev: any) => {
                
                if (ev.custom?.campus_room_location) {
                    if(/online/i.test(ev.custom.campus_room_location)) {
                        ev.custom.campus_room_location = "Online";
                    } else if(/potsdam/i.test(ev.custom.campus_room_location) || /^r(o+)m(\s+)[0-9]+$/i.test(ev.custom.campus_room_location)) {
                        const parts = ev.custom.campus_room_location?.trim().split(/\s+/);
                        ev.custom.campus_room_location = "Room "+parts[parts.length-1];
                    }
                    }
                }
            );

            await fs.writeFile(filepath, JSON.stringify(contents, null, 2));
            const result = await this.readFile(filepath);

            return result;
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            throw new Error(`Failed to fetch events: ${msg}`);
        }
    }

    /**
     * Retrieves a single event by its ID.
     * @param filename Name of the file containing events.
     * @param eventId ID of the event to retrieve.
     * @returns The matching calendar event.
     * @throws Error if the event cannot be found.
     */
    async getEvent(filename: string, eventId: string): Promise<ICalendarEventProp> {
        try {
            const events = await this.getEvents(filename);

            const event = events.find((ev: ICalendarEventProp) => ev.id === eventId);
            if (!event) throw new Error("Specified event not found");

            return event;
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            throw new Error(`Failed to fetch specified event: ${msg}`);
        }
    }

    /**
     * Updates a specific event with new values.
     * @param filename Name of the file containing events.
     * @param eventId ID of the event to update.
     * @param params Partial event data to apply.
     * @returns The updated event object.
     * @throws Error if the event cannot be found or updated.
     */
    async editEvent(filename: string, eventId: string, params: Partial<ICalendarEventProp>[]) {
        try {
            const filepath = await this.verifyFile(filename);
            const file = await this.readFile(filename);

            const eventIndex = file.events.findIndex((ev: ICalendarEventProp) => ev.id === eventId);

            if (eventIndex === -1) throw new Error("Specified event not found")

            file.events[eventIndex] = {
                ...file.events[eventIndex],
                ...params[0]
            }

            await fs.writeFile(filepath, JSON.stringify(file, null, 2),"utf-8");

            return file.events[eventIndex];
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            throw new Error(`Failed to edit specified event: ${msg}`);
        }
    }    
}