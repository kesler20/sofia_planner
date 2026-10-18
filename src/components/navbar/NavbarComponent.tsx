import { useLocation } from "react-router-dom";
import { type ValidViews } from "../../pages/Pages";
import { useAuth0 } from "@auth0/auth0-react";
import * as React from "react";
import { ToastContainer } from "react-toastify";
import { entryUrl, personalPreferenceKey } from "../../entry/appMode";
import PlannerNavigation from "./PlannerNavigation";

// ============================================================ //
//                                                              //
//   NAVBAR COMPONENT                                          //
//                                                              //
//   Owns account authentication and mobile navigation state.   //
//   Supplies the responsive PlannerNavigation with events.     //
//   Page links route directly and logout ends the session.     //
//                                                              //
// ============================================================ //
export default function NavbarComponent() {
  // ====================== //
  //                        //
  //   STATE VARIABLES      //
  //                        //
  // ====================== //
  const [openDomain, setOpenDomain] = React.useState<ValidViews | null>(null);
  const { logout, user } = useAuth0();
  const location = useLocation();
  const shared = location.pathname.includes("/share/");
  // ====================== //
  //                        //
  //   OBSERVE STATE        //
  //                        //
  // ====================== //
  console.debug("navigation", { path: location.pathname, openDomain });
  // ====================== //
  //                        //
  //   SIDE EFFECTS         //
  //                        //
  // ====================== //
  React.useEffect(() => { setOpenDomain(null); }, [location.pathname]);
  React.useEffect(() => {
    const desktop = window.matchMedia("(min-width: 900px)");
    const handleEventResize = () => { if (desktop.matches) setOpenDomain(null); };
    desktop.addEventListener("change", handleEventResize);
    return () => desktop.removeEventListener("change", handleEventResize);
  }, []);
  // ====================== //
  //                        //
  //   UI EVENT HANDLERS    //
  //                        //
  // ====================== //
  // ------------------------------------------------------ Navigation
  function handleEventDomain(domain: ValidViews) { setOpenDomain(domain); }
  function handleEventClose() { setOpenDomain(null); }
  function handleEventDemo() { window.location.assign(entryUrl("demo")); }
  function handleEventLanding() { window.location.assign(entryUrl("landing")); }
  // ------------------------------------------------------ Account
  function handleEventLogout() {
    localStorage.removeItem(personalPreferenceKey);
    void logout({ logoutParams: { returnTo: new URL(import.meta.env.BASE_URL, window.location.origin).href } });
  }
  // ====================== //
  //                        //
  //   UTILS METHODS        //
  //                        //
  // ====================== //
  // Route selection is derived by PlannerNavigation from the current URL.
  // ====================== //
  //                        //
  //   UI COMPONENTS        //
  //                        //
  // ====================== //
  return <><ToastContainer position="top-right"/><PlannerNavigation openDomain={openDomain} accountName={user?.name} shared={shared} onEventDomain={handleEventDomain} onEventClose={handleEventClose} onEventLogout={handleEventLogout} onEventDemo={handleEventDemo} onEventLanding={handleEventLanding}/></>;
}
