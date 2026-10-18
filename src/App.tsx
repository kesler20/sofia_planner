import * as React from "react";
import PlannerTheme from "./components/PlannerTheme";
import { initialMode } from "./entry/appMode";
import "./entry/landing.css";
import LandingPage from "./entry/LandingPage";

const PersonalApp = React.lazy(() => import("./PersonalApp"));
const DemoApp = React.lazy(() => import("./demo/DemoApp"));

// ============================================================ //
//   APP ENTRY                                                  //
//   Public website selects independent personal and demo roots. //
// ============================================================ //
export default function App() {
  // ====================== //
  //                        //
  //   STATE VARIABLES
  //                        //
  // ====================== //
  const [mode] = React.useState(initialMode);
  // ====================== //
  //                        //
  //   OBSERVE STATE
  //                        //
  // ====================== //
  console.debug("app entry", { mode });
  // ====================== //
  //                        //
  //   SIDE EFFECTS
  //                        //
  // ====================== //
  // ====================== //
  //                        //
  //   UI EVENT HANDLERS
  //                        //
  // ====================== //
  // ====================== //
  //                        //
  //   UTILS METHODS
  //                        //
  // ====================== //
  // ====================== //
  //                        //
  //   UI COMPONENTS
  //                        //
  // ====================== //
  if (mode === "personal") return <React.Suspense fallback={<p className="p-6" role="status">Opening personal planner…</p>}><PersonalApp /></React.Suspense>;
  if (mode === "demo") return <React.Suspense fallback={<p className="p-6" role="status">Opening demo…</p>}><DemoApp /></React.Suspense>;
  return <PlannerTheme><LandingPage /></PlannerTheme>;
}
