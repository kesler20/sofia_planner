import * as React from "react";
import { HashRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import PlannerTheme from "../components/PlannerTheme";
import PlannerNavigation from "../components/navbar/PlannerNavigation";
import Pages, { type ValidViews } from "../pages/Pages";
import { AccountContext } from "../auth/accountContext";
import { clearAccountCache } from "../utils";
import { entryUrl } from "../entry/appMode";
import { demoAccount, installDemoStorage, resetDemo } from "./demoStorage";

// ============================================================ //
//   DEMO APP                                                   //
//   Production pages use an isolated browser-only resource store.
// ============================================================ //
export default function DemoApp() {
  // ====================== //
  //                        //
  //   STATE VARIABLES
  //                        //
  // ====================== //
  const [ready, setReady] = React.useState(false);
  const [openDomain, setOpenDomain] = React.useState<ValidViews | null>(null);
  // ====================== //
  //                        //
  //   OBSERVE STATE
  //                        //
  // ====================== //
  console.debug("demo", { ready, openDomain });
  // ====================== //
  //                        //
  //   SIDE EFFECTS
  //                        //
  // ====================== //
  React.useEffect(() => { installDemoStorage(); setReady(true); }, []);
  // ====================== //
  //                        //
  //   UI EVENT HANDLERS
  //                        //
  // ====================== //
  function handleEventReset() {
    if (!window.confirm("Reset this browser’s demo changes?")) return;
    resetDemo(); clearAccountCache(demoAccount); window.location.reload();
  }
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
  if (!ready) return <p className="p-6" role="status">Preparing sample data…</p>;
  return <PlannerTheme><HashRouter><AccountContext.Provider value={demoAccount}>
    <ToastContainer position="top-right" />
    <div className="demo-toolbar"><strong>Demo · sample data</strong><span>Changes stay in this browser. Analytics show sample results.</span><button type="button" onClick={handleEventReset}>Reset demo</button><a href={entryUrl("personal")}>Personal sign-in</a><a href={entryUrl("landing")}>About Sofia</a></div>
    <PlannerNavigation accountName="Demo" openDomain={openDomain} onEventDomain={setOpenDomain} onEventClose={() => setOpenDomain(null)} onEventLogout={() => window.location.assign(entryUrl("landing"))} />
    <main id="main-content" tabIndex={-1} className="sofia-page-content"><Pages /></main>
  </AccountContext.Provider></HashRouter></PlannerTheme>;
}
