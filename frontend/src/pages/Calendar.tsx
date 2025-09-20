import { useEffect, useState } from "react";
import { format, setHours, setWeek } from "date-fns";

import { FaExclamationTriangle } from "react-icons/fa";


const Calendar = () => {
    const [eventsLoading, setEventsLoading] = useState<boolean>(false);
    const [availabilityLoading, setAvailabilityLoading] = useState<boolean>(false);
    const [saveCalendarLoading, setSaveCalendarLoading] = useState<boolean>(false);
    const [calendarId, setCalendarId] = useState<string | null>("kstoem2e1bvp4nc4j8");
    const [events, setEvents] = useState<any[]>();
    const [filteredEvents, setFilteredEvents] = useState<any[]>();
    const [profs, setProfs] = useState<string[] | null>(null);
    const [selectedProf, setSelectedProf] = useState<string | null>("All");
    const [calTitle, setCalTitle] = useState<string>();
    const [calName, setCalName] = useState<string>();
    const [overlapCount, setOverlapCount] = useState<number>(0);
    const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
    const [availableTimes, setAvailableTimes] = useState<Record<string, Record<string, any[]>>>({});
    const [eventDuration, setEventDuration] = useState<number | null>(null);
    const [weekDay, setWeekDay] = useState<string | null>("All");
    const [showOverlap, setShowOverlap] = useState<boolean>(true);
    const [startDate, setStartDate] = useState(events && events.length > 0 ? new Date(events[0].end_dt).toISOString().split("T")[0] : "");
    const [endDate, setEndDate] = useState(events && events.length > 0 ? new Date(events[events.length - 1].end_dt).toISOString().split("T")[0] : "");    
    let count: number = 0;


    console.log(availableTimes);
    
    
    const findOverlaps = (fetchedEvents: any[]) => {
        for (let i = 0; i < fetchedEvents.length; i++) {
            const prev = fetchedEvents[i-1];
            const curr = fetchedEvents[i];
            const next = fetchedEvents[i+1];

            const hasOverlap = (prev && new Date(prev.end_dt) > new Date(curr.start_dt)) || (next && new Date(next.start_dt) < new Date(curr.end_dt));
            // const hasRoomOverlap = (prev && prev.custom && curr.custom && prev.custom.campus_room_location === curr.custom.campus_room_location) || (next && next.custom && next.custom.campus_room_location === curr.custom) && curr.custom.campus_room_location;

            
            if (hasOverlap) {
                curr._overlap = true;
                count++;
            } else {
                curr._overlap = false;
            }
        }

        setOverlapCount(count);
        return fetchedEvents;
    }

    const saveCalendar = async () => {
        setSaveCalendarLoading(true);
        try {
            if (!calendarId) throw new Error("Select calendar first!");
            const response = await fetch(`http://localhost:3999/api/calendar/${calendarId}/save`, {
                method: "GET",
                credentials: "include"
            });

            if (!response.ok) throw new Error("Failed to send API request");

            alert(`Saved calendar successfully: ${response.status}. Look for json-output folder in the root directory of your project`)            
        } catch (error: any) {
            alert(`Error occured while saving: ${error.message}`);
        } finally {
            setSaveCalendarLoading(false);
        }
    }

    const getCalendarInfo = async (calId: string) => {
        try {
            const response = await fetch(`http://localhost:3999/api/calendar/${calId}/config`, {
                method: "GET",
                credentials: "include",
            });
    
            if (!response.ok) console.error("Error fetching events");
    
            const data = await response.json();

            setCalTitle(data.configuration.identity.title);
            setCalName(data.configuration.link.name);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Unknown error";
            console.error("Failed to fetch calendar info:", msg);
        }
    }
    
    const getEvents = async (calId: string, showOverlap?: boolean, startDate?: string, endDate?: string) => {
        setEventsLoading(true);
        try {
            let query = "";
            if (startDate) query+=`start=${new Date(startDate).toISOString().split("T")[0]}`;
            if (endDate) query+=(query ? "&" : "")+`end=${new Date(endDate).toISOString().split("T")[0]}`;
            
            const url = `http://localhost:3999/api/calendar/${calId}/events?${query ? `?${query}` : ""}`
            
            const response = await fetch(url, {
                method: "GET",
                credentials: "include"
            });

            if (!response.ok) throw new Error("Failed to send API request");

            
            const data = await response.json();
            
            const filteredEvents = findOverlaps(data);

            const events = showOverlap ? filteredEvents.filter(ev => ev._overlap === true) : filteredEvents;
             
            setEvents(events);
            setFilteredEvents(events);
            setProfs([...(new Set(events.map(ev => ev.who)))]);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Unkown error";
            console.error("Failed to fetch events:", msg);
            alert(`Failed to fetch events: ${msg}`)
        } finally {
            setEventsLoading(false);
        }
    }


    async function handleSubmit(e: any) {
        e.preventDefault();
        if (!calendarId) throw new Error("Select calendar ID first!");
        getEvents(calendarId, false, startDate, endDate);
    }

    const checkAvailability = async () => {
        if (!selectedEvent) {
            console.warn("No event selected for availability check.");
            return;
        }

        setAvailabilityLoading(true);
        try {
            const response = await fetch(
                `http://localhost:3999/api/calendar/${calendarId}/events/${selectedEvent}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                }
            );

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const data = await response.json();

            setEventDuration(data[1].eventDurationHours);

            
            const times = data[1].availableTimes.filter((ev: any) => format(new Date(ev.start), "EEE") !== "Sun") || [];
            

            // Group available times by month
            const grouped = times.reduce(
                (months: Record<string, Record<string, any[]>>, slot: any) => {
                    const monthKey = format(new Date(slot.start), "MMM yyyy");
                    const dayKey = format(new Date(slot.start), "EEE d, MMM");

                    if (!months[monthKey]) {
                    months[monthKey] = {};
                    }
                    if (!months[monthKey][dayKey]) {
                    months[monthKey][dayKey] = [];
                    }
                    months[monthKey][dayKey].push(slot);
                    return months;
                }, {});

            setAvailableTimes(grouped);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Unknown error";
            console.error("Failed to fetch available hours:", msg);
        } finally {
            setAvailabilityLoading(false);
        }
    };

    const checkProf = async (prof: string) => {
        if (!events) throw new Error("sosal?")
        const fevs = prof !== "All" ? findOverlaps(events?.filter(ev => ev.who === prof)) : findOverlaps(events);
        setFilteredEvents(fevs);
    }

    const clearSelection = () => {
        setSelectedEvent(null);
        setAvailableTimes({});
        setEventDuration(null);
        setWeekDay("All");
        setSelectedProf("All");
    }

  return (
    <>
        {/* Page heading */}
        <h1 className="text-xl font-semibold">Welcome to Calendar Handler!</h1>
        <p className="font-light text-sm">Select option from below to see the API output:</p>

        {/* Calendar info and interaction buttons */}
        <div className="mt-10 flex-1 flex-col">
            <label htmlFor="cal-id-selector" className="inline-block text-sm mb-1">Select calendar (first save it)</label>
            <select defaultValue="kstoem2e1bvp4nc4j8" id="cal-id-selector" className="block mb-5 border-b rounded-md focus:outline-0" onChange={(e) => setCalendarId(e.target.value)} required>
                <option value="kstoem2e1bvp4nc4j8">BSE Oct 2023</option>
                <option value="ksh61p2d97npottv3o">Tutor Mazhar Hameed</option>
                <option value="ksoztna2so27r5bxfu">Tutor Reza Babei</option>
                <option value="kskstdy2uw3p89e1f2">Tutor Alireza Mahmoud</option>
            </select>
            <div className="inline-block bg-blue-300 px-2 rounded-xl my-1">Calendar Title</div>
            {calTitle}
            <br />
            <div className="inline-block bg-green-300 px-2 rounded-xl my-1">Calendar Name</div>
            {calName}
            <br />
            Actions:
            {/* <Option color="orange" onClick={() => {getCalendarInfo(); getEvents()}}>Get Events</Option> */}
            <button className={`${!eventsLoading ? "bg-orange-300 hover:bg-orange-400 cursor-pointer" : "bg-orange-200"} px-4 rounded-xl my-1 mt-10 mx-2`} onClick={() => {calendarId && getCalendarInfo(calendarId); calendarId && getEvents(calendarId)}}>
                {!eventsLoading ? "Get Events" : "Fetching..."}
                </button>
            <button className={`${selectedEvent === null ? "bg-gray-300 cursor-not-allowed" : !availabilityLoading ? "bg-purple-300 hover:bg-purple-400 cursor-pointer" : "bg-purple-200"} px-4 rounded-xl my-1 mt-10 mx-2`} onClick={() => checkAvailability()} disabled={selectedEvent === null}>
                {!availabilityLoading ? "Check Availability" : "Checking..."}
            </button>
            <button className={`bg-red-300 px-4 rounded-xl cursor-pointer hover:bg-red-400 my-1 mt-10 mx-2`} onClick={() => clearSelection()}>
                Clear Selection
            </button>
            <button className={`bg-green-300 px-4 rounded-xl cursor-pointer hover:bg-green-400 my-1 mt-10 mx-2`} onClick={() => calendarId && saveCalendar()}>
                Save Calendar
            </button>
        </div>

        {/* Available times space */}
        <div className="mt-10">
            {/* <iframe src="https://teamup.com/ksh61p2d97npottv3o?tz=Calendar%20default&showLogo=0&showSearch=0&showProfileAndInfo=0&showSidepanel=1&showViewHeader=1&showAgendaDetails=0&showDateControls=1&showDateRange=1" style={{width: "100%", height: "600px", border: "1px solid #cccccc"}} loading="lazy" frameBorder={0}></iframe> */}
            <div className={`${eventDuration ? "block" : "hidden"} mb-5`}>
                <p>Event duration: {eventDuration} hrs</p>
                <p>Available timeslots: {Object.values(availableTimes).reduce((sum, innerObj) => {return sum + Object.values(innerObj).reduce((innerSum, arr) => innerSum + arr.length, 0);}, 0)}</p>
                <p className="inline-block me-5">Select week day</p>
                <select name="weekDay" id="week-day" onChange={(e) => setWeekDay(e.target.value)} className="border border-gray-400 rounded-lg px-1">
                        <option value="All">All</option>
                        <option value="Mon">Monday</option>
                        <option value="Tue">Tuesday</option>
                        <option value="Wed">Wednesday</option>
                        <option value="Thu">Thursday</option>
                        <option value="Fri">Friday</option>
                        <option value="Sat">Saturday</option>
                </select>
            </div>

            {availableTimes ? Object.entries(availableTimes).map(([month, days]) => (
                // Month part
                <div key={month}>
                    <div className="inline-block border-b w-20 border-2 me-1"></div>
                    {month}
                    <div className="inline-block border-b w-20 border-2 me-1"></div>
                    <br />

                    {/* Days part */}
                    <div className="grid grid-cols-6 gap-y-4 gap-x-2">
                        {Object.entries(days).map(([day, slots]) => (
                            <div key={day} className={`inline-block ${weekDay && ((day.includes(weekDay)) || weekDay === "All") ? "bg-purple-200" : "bg-gray-300"} mx-2 rounded-lg`}>
                                <p className={`${weekDay && (day.includes(weekDay) || weekDay === "All") ? "bg-purple-400" : "bg-gray-400"} px-2 rounded-lg`}>{day}</p>

                                {/* Hours part */}
                                {slots.map((slot, idx) => (
                                    <ul key={idx} className="px-3 list-disc">
                                        <li className="ms-4">{format(slot.start, "HH:mm")} - {format(slot.end, "HH:mm")}</li>
                                    </ul>
                                ))}
                            </div>
                        ))}
                    </div>
                    <br />
                </div>
            )) : ""}
        </div>
    
        {/* Events related info and events table */}
        <div className="mt-10">
            <div className="flex justify-between">
                <div className="flex flex-col">
                    <p>Period: 2024-2026</p>
                    <p>Total: <span className="font-bold">{filteredEvents ? filteredEvents.length : 0}</span></p>
                    <p>Overlap Events Count: <button className="font-bold text-red-600 underline cursor-pointer" onClick={() => {setShowOverlap(!showOverlap); calendarId && getEvents(calendarId, showOverlap)}}>{overlapCount}<FaExclamationTriangle className="inline mb-1 ms-1" /></button></p>
                </div>
                {filteredEvents && filteredEvents.length > 0 ? (
                    <div className="flex flex-col">
                        <label htmlFor="prof-select">Select Professor Filter</label>
                        <select name="" id="prof-select" defaultValue="All" className="border rounded-lg text-xs" onChange={(e) => {setSelectedProf(e.target.value); checkProf(e.target.value)}}>
                            <option value="All">All</option>
                            {profs && profs.length > 0 ? profs.map((prof, idx) => (
                                <option key={idx} value={prof}>{prof}</option>
                            )) : null}
                        </select>
                    </div>
                ): null}
                {filteredEvents && filteredEvents.length > 0 ? (
                    <form className="flex flex-col" onSubmit={handleSubmit}>
                        <p>Select date range: <button type="submit" className="px-2 bg-red-300 rounded-xl cursor-pointer">Select</button></p>
                        <div className="flex items-center justify-between w-[220px]">
                            <label htmlFor="start">Start</label>
                            <input type="date" id="start" className="border rounded-lg px-1" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div className="flex items-center justify-between">
                            <label htmlFor="end">End</label>
                            <input type="date" id="end" className="border rounded-lg px-1" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                    </form>
                ) : null}
            </div>

            {/* Events table */}
            <table className="w-full border">
                <thead>
                    <tr className="border bg-blue-100">
                        <th>ID</th>
                        <th className="border">Event</th>
                        <th className="border">Host</th>
                        <th className="border">Location</th>
                        <th className="border">Start</th>
                        <th className="border">End</th>
                        <th className="border">Timezone</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredEvents ? filteredEvents.map((ev: any) => {
                        const custom = ev.custom ? ev.custom : {"campus_room_location" : "N/A"}
                        
                        return (
                        <tr key={ev.id} className={`text-left text-sm ${selectedEvent === ev.id ? "bg-blue-100 hover:bg-blue-200" : "hover:bg-gray-200 "} cursor-pointer`} onClick={() => setSelectedEvent(ev.id)}>
                            <th className={`font-normal border p-1 text-center bg-gray-200 relative ${ev._overlap ? "bg-red-200" : ""}`}>{ev.id}</th>
                            <th className="font-normal border p-1 min-w-40">{ev.title}</th>
                            <th className="font-normal border p-1 min-w-40 text-center">{ev.who}</th>
                            <th className="font-normal border p-1 min-w-40 text-center">{custom.campus_room_location}</th>
                            <th className="font-normal border p-1 min-w-40 text-center">{format(ev.start_dt, "MMM dd, yyyy | HH:mm")}</th>
                            {/* <th className="font-normal border p-1 min-w-40 text-center">{new Date(ev.start_dt).getTime()}</th> */}
                            <th className="font-normal border p-1 min-w-40 text-center">{format(ev.end_dt, "HH:mm | MMM dd, yyyy")}</th>
                            {/* <th className="font-normal border p-1 min-w-40 text-center">{new Date(ev.end_dt).getTime()}</th> */}
                            <th className="font-normal border p-1 min-w-40 text-center">{ev.tz}</th>
                        </tr>
                    )}): eventsLoading ? "Loading events..." : "No events found"}
                </tbody>
            </table>
        </div>
    </>
  )
}

export default Calendar;