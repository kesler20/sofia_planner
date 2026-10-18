import { CircleArrowLeft, CircleArrowRight, CalendarDays } from "lucide-react";

// ============================================================ //
//                                                              //
//   DIET DATE NAVIGATION                                      //
//                                                              //
//   Presents the selected date and three day-navigation actions.//
//   DietAnalyticsPage owns the date and handles button events.  //
//                                                              //
// ============================================================ //
export default function DietDateNavigation(props: { date: string; today: string; onEventPrevious: () => void; onEventToday: () => void; onEventNext: () => void }) {
  return <div className="w-fit min-w-0 space-y-1">
    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${props.date}T00:00:00Z`))}</p>
    <nav aria-label="Monitoring date" className="flex items-center gap-2 text-sm text-slate-500">
      <button type="button" aria-label="Yesterday" title="Previous day" className="flex items-center gap-2 rounded-lg py-2 pr-2 hover:text-violet-700 focus-visible:outline-violet-700" onClick={props.onEventPrevious}><CircleArrowLeft size={19} aria-hidden="true"/>Yesterday</button>
      <button type="button" aria-label="Today" aria-current={props.date === props.today ? "date" : undefined} className="flex items-center gap-2 rounded-lg px-2 py-2 hover:text-violet-700 focus-visible:outline-violet-700" onClick={props.onEventToday}>Today<CalendarDays size={19} aria-hidden="true"/></button>
      <button type="button" aria-label="Tomorrow" title="Next day" className="flex items-center gap-2 rounded-lg py-2 pl-2 hover:text-violet-700 focus-visible:outline-violet-700" onClick={props.onEventNext}>Tomorrow<CircleArrowRight size={19} aria-hidden="true"/></button>
    </nav>
  </div>;
}
