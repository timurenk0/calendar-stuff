import { useEffect, useState } from "react";

// Types
type Event = {
  title: string;
  start_dt: string;
  custom?: {
    campus_room_location: string
  }
};

type NormalizedEvent = {
  title: string;
  dayOfWeek: string;
  dateLabel: string;
  hours: string;
  year: number;
  weekNumber: number;
  room: string;
};

// --- Utils ---
function getWeekNumber(d: Date): number {
  // ISO week number (1–53)
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7; // Sun=0 → 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function normalizeEvents(events: Event[], year: number): NormalizedEvent[] {
  return events.map((e) => {
    const d = new Date(e.start_dt);
    const dayOfWeek = d.toLocaleDateString("en-US", { weekday: "short" });
    const dateLabel = d.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });
    const hours = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const weekNumber = getWeekNumber(d);
    const room = e.custom ? e.custom.campus_room_location : "N/A";

    return { title: e.title, dayOfWeek, dateLabel, hours, year, weekNumber, room };
  });
}

// --- Component ---
export default function Comparator() {
  const [events, setEvents] = useState<Record<string, NormalizedEvent[]>>({});

  useEffect(() => {
    Promise.all([
      fetch(
        "http://localhost:3999/json-api/calendar/ksh61p2d97npottv3o/events?start=2024-01-01&end=2025-01-01",
        { method: "GET", credentials: "include" }
      ).then((r) => r.json()),
      fetch(
        "http://localhost:3999/json-api/calendar/ksh61p2d97npottv3o/events?start=2025-01-01&end=2026-01-01",
        { method: "GET", credentials: "include" }
      ).then((r) => r.json()),
    ]).then(([events2024, events2025]) => {
      setEvents({
        "2024": normalizeEvents(events2024, 2024),
        "2025": normalizeEvents(events2025, 2025),
      });
    });
  }, []);

  const years = Object.keys(events);
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const maxWeeks = 53; // ISO week max

  return (
    <div className="overflow-x-auto">
      <table className="table-auto border-collapse border border-gray-300 w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-gray-300 p-2">Week / Day</th>
            {years.map((y) => (
              <th key={y} className="border border-gray-300 p-2 text-center">
                {y}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: maxWeeks }).map((_, weekIdx) =>
            weekdays.map((day) => (
              <tr key={`${weekIdx}-${day}`}>
                <td className="border border-gray-300 p-2 font-semibold whitespace-nowrap">
                  W{weekIdx + 1} {day}
                </td>
                {years.map((y) => (
                  <td key={y} className="border border-gray-300 p-2 align-top">
                    {events[y]
                      ?.filter(
                        (ev) =>
                          ev.weekNumber === weekIdx + 1 &&
                          ev.dayOfWeek === day
                      )
                      .map((ev, i) => (
                        <div key={`${ev.title}-${i}`} className="mb-1">
                          {ev.dateLabel} {ev.hours} – {ev.title} - {ev.room}
                        </div>
                      ))}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
