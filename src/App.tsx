import * as React from "react";
import PlannerTheme from "./components/PlannerTheme";
import { entryUrl, initialMode } from "./entry/appMode";
import "./entry/landing.css";

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
  return <PlannerTheme><main className="sofia-landing">
    <header><a className="landing-brand" href={entryUrl("landing")}>Sofia<span>Planner</span></a><a href="https://github.com/kesler20/sofia_planner">Source code ↗</a></header>
    <section className="landing-intro"><p className="landing-eyebrow">A place for your everyday plans</p><h1>Make room for<br />what matters.</h1><p>Plan your meals. Give your money a purpose. See your health in perspective.</p>
      <div className="landing-actions"><a className="landing-primary" href={entryUrl("demo")}>Try the demo <span aria-hidden="true">↗</span></a><a className="landing-secondary" href={entryUrl("personal")}>Personal sign-in</a></div>
      <p className="landing-note">Explore with sample data, or open your private planner.</p>
    </section>
    <section className="landing-domains" aria-label="Inside Sofia"><article><span aria-hidden="true">🥗</span><h2>Diet</h2><p>A week of meals, with cost and nutrition in view.</p></article><article><span aria-hidden="true">💷</span><h2>Finance</h2><p>Budgets, spending patterns and investment plans.</p></article><article><span aria-hidden="true">🌱</span><h2>Health</h2><p>Daily progress and the personal records behind it.</p></article></section>
    <footer>Open source. Your own planner.<p>Clone the repository to host a version connected to your own accounts.</p></footer>
  </main></PlannerTheme>;
}
