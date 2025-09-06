export class DateFormatter {
    private monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    
    constructor () {}

    /**
     * Checks if the provided year parameter is leap year.
     * @param year Four-digit year.
     * @returns True if year is leap; otherwise, false.
     */
    private isLeapYear(year: number): boolean {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0); 
    }

    /**
     * Gets the maximum valid day in the given month and year. 
     * Accounts for leap years as if the month is February.
     * @param month Month number (1-12).
     * @param year Four-digit year.
     * @returns Maximum possible day value for the month.
     */
    private getMaxDay(month: number, year: number): number {
        if (month < 1 || month > 12) throw new Error("Invalid month value");
        if (month === 2 && this.isLeapYear(year)) return 29;
        return this.monthDays[month-1];
    }
    
    /**
     * Formats given date string to ISO standard date format (yyyy-MM-dd). 
     * Validates date strucuture, value ranges and leap year handling.
     * @param date Input date parameter.
     * @returns ISO standard date string.
     */
    public formatDate(date: string): string {
        const regex = /^(\d{1,2}|\d{4})(\D)(\d{1,2})\2(\d{1,2}|\d{4})$/
        const parsedDateString = date.match(regex);

        if (!parsedDateString) throw new Error("Incorrect date format");
        
        const dateTokens = [
            {value: parsedDateString[1]},
            {value: parsedDateString[3]},
            {value: parsedDateString[4]},
        ];

        const yearPart = dateTokens.filter(t => t.value.length === 4)[0];
        const otherParts = dateTokens.filter(t => t !== yearPart);

        if (!yearPart || otherParts.length !== 2) {
            throw new Error("Invalid date structure: year or other parts missing");
        }

        const year = parseInt(yearPart.value);
        const month = parseInt(otherParts[1].value);
        const day = parseInt(otherParts[0].value);

        if (
            isNaN(year) ||
            isNaN(month) ||
            isNaN(day) ||
            year < 0 ||
            month < 1 ||
            month > 12 ||
            day < 1 ||
            day > this.getMaxDay(month, year)
        ) {
            throw new Error("Incorrect year/month/day value(s)");
        }


        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    /**
     * Parses and formats a time string to HH:mm:ss.
     * Validates time structure and value ranges.
     * @param time - Input time string.
     * @returns Formatted time string.
     */
    public formatTime(time: string): string {
        const regex = /^(\d{1,2})(\D)(\d{1,2})\2(\d{1,2})$/;
        const parsedTimeString = time.match(regex);

        if (!parsedTimeString || parsedTimeString.length < 5) {
            throw new Error("Invalid time format");
        }

        const hours = parseInt(parsedTimeString[1]);
        const minutes = parseInt(parsedTimeString[3]);
        const seconds = parseInt(parsedTimeString[4]);

        if (
            isNaN(hours) ||
            isNaN(minutes) ||
            isNaN(seconds) ||
            hours < 0 ||
            hours > 23 ||
            minutes < 0 ||
            minutes > 59 ||
            seconds < 0 ||
            seconds > 59
        ) {
            throw new Error("Invalid hour/minute/second value(s)");
        }

        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    /**
     * Formats date and time strings to ISO 8601 format.
     * @param date - Date string.
     * @param time - Time string.
     * @returns ISO-formatted datetime string.
     */
    public format(date: string, time: string): string {
        return this.formatDate(date)+"T"+this.formatTime(time);
    }

    // Helper: Format local date (YYYY-MM-DD)
    public formatLocalDate(date: Date): string {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }

    // Helper: Format local date & time (YYYY-MM-DD HH:mm)
    public formatLocalDateTime(date: Date): string {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        const h = String(date.getHours()).padStart(2, "0");
        const min = String(date.getMinutes()).padStart(2, "0");
        return `${y}-${m}-${d} ${h}:${min}`;
    }
}