import { format } from "date-fns";
import { useState } from "react"

const Arranger = () => {
  const [timeslots, setTimeslots] = useState<{start: string, end: string}[]>([]);
  const [timeRange, setTimeRange] = useState({
    start: "08:00",
    finish: "20:00"
  });
  const [weekDays, setWeekDays] = useState<string[]>([]);

  const options = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  weekDays.includes("Sun") && alert("Big man ting bruv")


  const toggle = (value: string) => {
    setWeekDays((prev) => 
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    )
  }

  const foo = async () => {
      const response = await fetch("http://localhost:3999/api/calendar/ksh61p2d97npottv3o/events/1748184814", {
        method: "GET",
        credentials: "include"
      });

      if (!response.ok) throw new Error("Failed to fetch timeslots");

      const data = await response.json();


      setTimeslots(data[1].availableTimes);
      // return data[1].availableTimes;
  }

  const applyFilters = () => {
    setTimeslots(timeslots.filter(ts => weekDays.includes(format(new Date(ts.start), "EEE")))
        .filter(ts => {
          const [startHour, startMinute] = timeRange.start.split(":").map(Number);
          const [finishHour, finishMinute] = timeRange.finish.split(":").map(Number);

          const slotStart = new Date(ts.start);
          const slotEnd = new Date(ts.end);

          const startDate = new Date(slotStart);
          const finishDate = new Date(slotEnd);

          startDate.setHours(startHour, startMinute);
          finishDate.setHours(finishHour, finishMinute);
                    
          return slotStart >= startDate && slotEnd <= finishDate;
        })
    );
  };
  

  if (!timeslots) return (<h1>Fetching timeslots...</h1>)


  const onSubmit = async () => {
    await foo();
    applyFilters();
  }

  const clearFilters = async () => {
    setWeekDays([]);
    setTimeRange({ start: "08:00", finish: "20:00" })
    await foo();
  }

  return (
    <>
      <h1 className="text-xl font-semibold">Welcome to Arranger!</h1>
      <p className="text-sm font-light">Input initial event data and watch the magic happen.</p>

      <div className="my-3 grid grid-cols-3">
        <div>
          <label htmlFor="start-picker">Pick start hour of the working day:</label>
          <input
            type="time"
            id="start-picker"
            className="block"
            value={timeRange.start}
            onChange={(e) => setTimeRange((prev) => ({ ...prev, start: e.target.value }))}
          />
          <label htmlFor="start-picker">Pick finish hour of the working day:</label>
          <input
            type="time"
            id="finish-picker"
            className="block"
            value={timeRange.finish}
            onChange={(e) => setTimeRange((prev) => ({ ...prev, finish: e.target.value }))}
          />
        </div>
        <div className="flex flex-col">
          Select working days:
          {options.map(o => (
            <label key={o}>
              <input
                type="checkbox"
                checked={weekDays.includes(o)}
                onChange={() => toggle(o)}
              />
              {o}
            </label>
          ))}
        </div>
        <div>
          <button type="submit" className="border py-2 px-5 rounded-lg hover:bg-gray-200/75 cursor-pointer" onClick={onSubmit}>SUBMIT</button>
          <button type="button" className="border py-2 px-5 rounded-lg hover:bg-gray-200/75 cursor-pointer" onClick={clearFilters}>CLEAR FILTERS</button>
        </div>
      </div>

      <div>
        <table className="w-full">
          <thead className="border">
            <th className="border">ID</th>
            <th className="border">Start</th>
            <th className="border">End</th>
          </thead>
          <tbody className="border">
            {timeslots.map((ts, idx: number) => (
              <tr key={++idx} className="text-center">
                <td className="border">{++idx}</td>
                <td className="border">{format(new Date(ts.start), "yyyy-MM-dd HH:mm:SS EEE")}</td>
                <td className="border">{format(new Date(ts.end), "yyyy-MM-dd HH:mm:SS EEE")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default Arranger;