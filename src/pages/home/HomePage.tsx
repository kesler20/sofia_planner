import * as React from "react";
import { FaRegSun } from "react-icons/fa";
import { readResourceInDb, useStoredValue } from "../../utils";
import { Card, CardSectionDivider } from "../diet/Diet";
import toastFactory, {
  MessageSeverity,
} from "../../components/notification/ToastMessages";

// ====================== //
//                        //
//   TYPES                //
//                        //
// ====================== //

type Attendee = { name: string; email: string };

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  link: string;
  source: "personal" | "gousto";
  attendees: Attendee[];
  people_notes: string[];
};

type AgendaItem = { text: string; person: string };

type HomePageMeeting = { event: CalendarEvent; agenda_items: AgendaItem[] };

type HomePageTask = {
  id: string;
  title: string;
  list: string;
  dueDate: string | null;
  overdue: boolean;
};

type HomePageWeather = {
  summary: string;
  temperature_c: number | null;
  feels_like_c: number | null;
  precipitation_mm: number | null;
  wind_kph: number | null;
};

type HomePagePayload = {
  generated_at: string;
  weather: HomePageWeather;
  meetings: HomePageMeeting[];
  tasks: HomePageTask[];
  meals: string[];
};

type PlayState = "idle" | "playing" | "paused";

const HOME_PAGE_RESOURCE = "home_page";
const BRIEFING_RESOURCE = "home_page_briefing";

const emptyPayload: HomePagePayload = {
  generated_at: "",
  weather: {
    summary: "",
    temperature_c: null,
    feels_like_c: null,
    precipitation_mm: null,
    wind_kph: null,
  },
  meetings: [],
  tasks: [],
  meals: [],
};

/**
 * A coat is the call Kesler actually wants, so turn the numbers into one instruction
 * rather than making him read a forecast.
 */
export function whatToWear(weather: HomePageWeather): string {
  const feelsLike = weather.feels_like_c ?? weather.temperature_c;
  const advice: string[] = [];

  if (feelsLike !== null && feelsLike !== undefined) {
    if (feelsLike < 5) advice.push("heavy coat");
    else if (feelsLike < 12) advice.push("coat");
    else if (feelsLike < 18) advice.push("light jacket");
    else advice.push("no jacket needed");
  }
  if ((weather.precipitation_mm ?? 0) >= 1) advice.push("take an umbrella");
  if ((weather.wind_kph ?? 0) >= 30) advice.push("it is windy");

  return advice.join(", ");
}

export function meetingTime(event: CalendarEvent): string {
  if (!event.start.includes("T")) return "All day";
  return event.start.slice(11, 16);
}

// ====================== //
//                        //
//   MAIN COMPONENT       //
//                        //
// ====================== //

export default function HomePage() {
  const userEmail = localStorage.getItem("global/email") || "guest";

  const [payload, , isLoading] = useStoredValue<HomePagePayload>(
    userEmail,
    emptyPayload,
    HOME_PAGE_RESOURCE,
  );
  const [briefing, setBriefing] = React.useState<string>("");
  const [playState, setPlayState] = React.useState<PlayState>("idle");
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);

  const utteranceRef = React.useRef<SpeechSynthesisUtterance | null>(null);

  // ====================== //
  //                        //
  //   SIDE EFFECTS         //
  //                        //
  // ====================== //

  React.useEffect(() => {
    readResourceInDb<string>(userEmail, BRIEFING_RESOURCE).then(({ result }) => {
      if (!result) return;
      try {
        setBriefing(JSON.parse(result).briefing || "");
      } catch {
        setBriefing("");
      }
    });
  }, []);

  React.useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // ====================== //
  //                        //
  //   UI EVENT HANDLERS    //
  //                        //
  // ====================== //

  const handleEventPlay = () => {
    if (!briefing) {
      toastFactory("No briefing yet", MessageSeverity.WARNING);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(briefing);
    utteranceRef.current = utterance;
    utterance.onstart = () => setPlayState("playing");
    utterance.onend = () => setPlayState("idle");
    utterance.onerror = () => setPlayState("idle");
    window.speechSynthesis.speak(utterance);
  };

  const handleEventStop = () => {
    window.speechSynthesis.cancel();
    setPlayState("idle");
  };

  /**
   * Clearing the stored briefing is the trigger: automation_engine regenerates it on the
   * next loop precisely because the key is absent.
   */
  const handleEventRefreshBriefing = async () => {
    setIsRefreshing(true);
    handleEventStop();
    const { createResourceInDb } = await import("../../utils");
    const { error } = await createResourceInDb(
      userEmail,
      BRIEFING_RESOURCE,
      JSON.stringify({}),
    );
    setIsRefreshing(false);
    if (error) {
      toastFactory("Could not request a new briefing", MessageSeverity.ERROR);
      return;
    }
    setBriefing("");
    toastFactory("Briefing will regenerate shortly", MessageSeverity.SUCCESS);
  };

  // ====================== //
  //                        //
  //   RENDER               //
  //                        //
  // ====================== //

  const overdueCount = payload.tasks.filter((task) => task.overdue).length;

  return (
    <div className="w-full flex flex-col items-center justify-start min-h-screen bg-white">
      <Card className="w-[calc(100%-1rem)] md:w-1/2 max-w-[900px] mt-2 md:mt-4 bg-white p-2 md:p-4 py-4 md:py-6">
        <div className="w-full flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FaRegSun className="text-sky-400" size={20} />
            <h1 className="text-lg md:text-2xl font-bold text-gray-800">Daily Summary</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={playState === "playing" ? handleEventStop : handleEventPlay}
              className="px-3 py-1 rounded-full text-sm bg-sky-400 text-white hover:bg-sky-500"
            >
              {playState === "playing" ? "Stop" : "Play briefing"}
            </button>
            <button
              type="button"
              onClick={handleEventRefreshBriefing}
              disabled={isRefreshing}
              title="Regenerate the briefing on the next run"
              className="px-3 py-1 rounded-full text-sm bg-slate-200 text-slate-600 hover:bg-slate-300 disabled:opacity-40"
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {isLoading && <p className="text-sm text-gray-400 mt-4">Loading your day...</p>}

        {/* Weather */}
        <CardSectionDivider title="Weather" />
        <div className="mt-3">
          {payload.weather.summary ? (
            <>
              <p className="text-sm md:text-xl text-gray-400 font-bold">
                {payload.weather.temperature_c !== null
                  ? `${Math.round(payload.weather.temperature_c)}C now, `
                  : ""}
                {payload.weather.summary}
              </p>
              <p className="text-xs text-gray-500 mt-1">{whatToWear(payload.weather)}</p>
            </>
          ) : (
            <p className="text-sm text-gray-400">No forecast yet</p>
          )}
        </div>

        {/* Meetings */}
        <CardSectionDivider title="Meetings" />
        <div className="mt-3 flex flex-col gap-2">
          {payload.meetings.length === 0 && (
            <p className="text-sm text-gray-400">No meetings today</p>
          )}
          {payload.meetings.map((meeting) => (
            <Card key={meeting.event.id} className="bg-white p-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-gray-800 font-bold truncate">
                  {meetingTime(meeting.event)} {meeting.event.title}
                </p>
                {meeting.event.source === "gousto" && (
                  <span className="rounded-full px-2 py-1 text-xs font-semibold bg-blue-500 text-white shrink-0">
                    gousto
                  </span>
                )}
              </div>
              {meeting.event.people_notes.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  {meeting.event.people_notes.join(", ")}
                </p>
              )}
              {meeting.agenda_items.length > 0 && (
                <ul className="list-disc pl-5 mt-2">
                  {meeting.agenda_items.map((item, index) => (
                    <li key={index} className="text-xs text-gray-500">
                      {item.text}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>

        {/* Tasks */}
        <CardSectionDivider title="Tasks" />
        <div className="mt-3 flex flex-col gap-1">
          {payload.tasks.length === 0 && (
            <p className="text-sm text-gray-400">Nothing due today</p>
          )}
          {overdueCount > 0 && (
            <p className="text-xs text-red-400 font-semibold mb-1">
              {overdueCount} overdue
            </p>
          )}
          {payload.tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between gap-2">
              <p className="text-sm text-gray-500 truncate">{task.title}</p>
              <span
                className={
                  task.overdue
                    ? "rounded-full px-2 py-1 text-xs font-semibold bg-red-300 text-slate-800 shrink-0"
                    : "rounded-full px-2 py-1 text-xs font-semibold bg-gray-200 text-gray-700 shrink-0"
                }
              >
                {task.list}
              </span>
            </div>
          ))}
        </div>

        {/* Food */}
        <CardSectionDivider title="Food" />
        <div className="mt-3">
          {payload.meals.length === 0 ? (
            <p className="text-sm text-gray-400">No meals planned today</p>
          ) : (
            <p className="text-sm md:text-xl text-gray-400 font-bold">
              {payload.meals.join(", ")}
            </p>
          )}
        </div>

        {/* Briefing */}
        {briefing && (
          <>
            <CardSectionDivider title="Briefing" />
            <p className="mt-3 text-xs text-gray-500 whitespace-pre-line">{briefing}</p>
          </>
        )}
      </Card>
    </div>
  );
}
