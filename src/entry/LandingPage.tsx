import * as React from "react";
import { ArrowUpRight, ChevronRight, Check, Github } from "lucide-react";
import MainButton from "../components/button/MainButton";
import BookFeatureCard from "./components/BookFeatureCard";
import type { LandingFeature } from "./landingTypes";
import { entryUrl } from "./appMode";

// ============================================================ //
//   LANDING PAGE                                               //
//   Owns feature selection and public entry navigation.         //
// ============================================================ //
export default function LandingPage() {
  // ====================== //
  //                        //
  //   STATE VARIABLES
  //                        //
  // ====================== //
  const [feature,setFeature] = React.useState<LandingFeature>("diet");
  // ====================== //
  //                        //
  //   OBSERVE STATE
  //                        //
  // ====================== //
  console.debug("landing feature", {feature});
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
  function handleEventFeature(value: LandingFeature) { setFeature(value); }
  function handleEventDemo() { window.location.assign(entryUrl("demo") + ({diet:"#/diet",finance:"#/finance/rankings",health:"#/health/records"}[feature])); }
  function handleEventPersonal() { window.location.assign(entryUrl("personal")); }
  function handleEventSource() { window.location.assign("https://github.com/kesler20/sofia_planner"); }
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

  return <main className="sofia-landing">
    <header className="public-header"><a href={entryUrl("landing")} aria-label="Sofia Planner"><span className="site-title">sofiaPlanner</span></a><div><button aria-label="Open source" onClick={handleEventSource}><Github size={16}/><span>Open source</span></button><button className="public-personal" onClick={handleEventPersonal}>Personal sign-in <ArrowUpRight size={15}/></button></div></header>
    <section className="landing-hero"><div className="hero-copy"><h1>Plan your day.<br/><span>See the bigger picture.</span></h1><p className="hero-description">Meals that work for you. Money with a plan.<br className="desktop-break"/> Progress you can actually see.</p><div className="hero-actions"><div className="hero-primary-action"><MainButton text="Try the demo" onSubmit={handleEventDemo}/><ChevronRight size={23} aria-hidden="true"/></div><button className="personal-link" onClick={handleEventPersonal}>Open my planner <ArrowUpRight size={16}/></button></div><p className="hero-small"><Check size={14}/> No account needed for the demo</p></div>
    </section>
<section className="purple-stage book-stage"><div className="stage-orb" aria-hidden="true"/><svg className="landing-circle-pattern" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><circle cx="25" cy="25" r="5"/><circle cx="50" cy="25" r="10"/><circle cx="75" cy="25" r="15"/><circle cx="37.5" cy="50" r="7.5"/><circle cx="62.5" cy="50" r="12.5"/><circle cx="50" cy="75" r="10"/></svg><div className="stage-workspace"><BookFeatureCard domain={feature} onEventDomain={handleEventFeature} onEventDemo={handleEventDemo}/></div></section>
    <footer className="public-footer"><p>Your plans. Your own space.</p><span>Explore the demo, or clone Sofia to host a planner connected to your own accounts.</span><button onClick={handleEventSource}>View the project <ArrowUpRight size={15}/></button><a href="privacy.html">Digital Twin privacy</a></footer>
  </main>;
}
