import { NavLink, useLocation } from "react-router-dom";
import { Dialog } from "@mui/material";
import { X, ArrowUpRight, Home, Play, LogIn } from "lucide-react";
import { IoMdLogOut } from "react-icons/io";
import { pages, type ValidViews } from "../../pages/Pages";
import "./navigation.css";

const domains = [
  { id: "diet" as const, name: "Diet", emoji: "🍽️" },
  { id: "finance" as const, name: "Finance", emoji: "💰" },
  { id: "health" as const, name: "Health", emoji: "💪" },
];

// ============================================================ //
//                                                              //
//   PLANNER NAVIGATION                                        //
//                                                              //
//   Responsive page links beneath NavbarComponent. Renders a   //
//   desktop rail and mobile dock. Emits domain and close       //
//   events to its container. NavLink owns route navigation.     //
//                                                              //
// ============================================================ //
export default function PlannerNavigation(props: {
  openDomain: ValidViews | null;
  accountName?: string;
  shared?: boolean;
  isDemo?: boolean;
  onEventDemo?: () => void;
  onEventLanding?: () => void;
  onEventDomain: (domain: ValidViews) => void;
  onEventClose: () => void;
  onEventLogout: () => void;
}) {
  const location = useLocation();
  const activeDomain = domains.find(domain => pages[domain.id].some(page => page.link === location.pathname))?.id;
  return <>
    {/* Header and account */}
    <header className="sofia-app-header"><NavLink to="/diet/monitoring" className="sofia-wordmark" aria-label="Sofia Planner"><span className="text-[30px] font-bold site-title">sofiaPlanner</span></NavLink>{!props.shared && <div className="sofia-account"><span className="sofia-account-name text-gray-400">Hi {props.accountName} ✨</span>{props.onEventDemo && <button type="button" onClick={props.onEventDemo} disabled={props.isDemo} aria-label="Open demo" title="Open demo"><Play size={17} aria-hidden="true"/></button>}{props.onEventLanding && <button type="button" onClick={props.onEventLanding} aria-label="Open landing page" title="Website"><Home size={17} aria-hidden="true"/></button>}<button type="button" onClick={props.onEventLogout} aria-label={props.isDemo ? "Personal sign-in" : "Log out"} title={props.isDemo ? "Personal sign-in" : "Log out"}>{props.isDemo ? <LogIn size={20} aria-hidden="true"/> : <IoMdLogOut size={20} aria-hidden="true"/>}</button></div>}</header>
    {!props.shared && <>
      {/* Desktop page rail */}
      <nav className="sofia-sidebar" aria-label="All pages">{domains.map(domain => <section key={domain.id}><h2><span aria-hidden="true" className="text-lg">{domain.emoji}</span>{domain.name}</h2>{pages[domain.id].map(page => <NavLink end key={page.link} to={page.link}>{page.name}</NavLink>)}</section>)}</nav>
      {/* Mobile domain dock */}
      <nav className="sofia-mobile-dock" aria-label="Page sections">{domains.map(domain => <button key={domain.id} onClick={() => props.onEventDomain(domain.id)} aria-expanded={props.openDomain === domain.id} aria-haspopup="dialog" className={activeDomain === domain.id ? "is-active" : ""}><span aria-hidden="true" className="text-2xl leading-none">{domain.emoji}</span><span>{domain.name}</span></button>)}</nav>
      {/* Accessible mobile page sheet */}
      <Dialog open={props.openDomain !== null} onClose={props.onEventClose} aria-labelledby="sofia-sheet-title" className="sofia-page-dialog" PaperProps={{className:"sofia-page-sheet"}}>
        <div className="sofia-sheet-heading"><h2 id="sofia-sheet-title">{domains.find(domain => domain.id === props.openDomain)?.name}</h2><button aria-label="Close page menu" onClick={props.onEventClose}><X size={20}/></button></div>
        <nav aria-label="Section pages">{props.openDomain && pages[props.openDomain].map(page => <NavLink end key={page.link} to={page.link} onClick={props.onEventClose}>{page.name}<ArrowUpRight size={17} aria-hidden="true"/></NavLink>)}</nav>
      </Dialog>
    </>}
  </>;
}
