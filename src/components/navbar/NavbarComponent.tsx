import { useLocation } from "react-router-dom";
import { type ValidViews } from "../../pages/Pages";
import { useAuth0 } from "@auth0/auth0-react";
import * as React from "react";
import { ToastContainer } from "react-toastify";
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
  const { logout, user, isAuthenticated, isLoading, loginWithRedirect, error } = useAuth0();
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
  React.useEffect(() => {
    if (isAuthenticated && user) localStorage.setItem("global/email", user.email?.replace("@", "_at_") || "guest");
  }, [isAuthenticated, user]);
  React.useEffect(() => { setOpenDomain(null); }, [location.pathname]);
  React.useEffect(() => {
    const desktop = window.matchMedia("(min-width: 900px)");
    const handleEventResize = () => { if (desktop.matches) setOpenDomain(null); };
    desktop.addEventListener("change", handleEventResize);
    return () => desktop.removeEventListener("change", handleEventResize);
  }, []);
  React.useEffect(() => {
    if (isLoading || isAuthenticated || shared) return;
    if (error) {
      // Preserve the retry delay for transient silent-token failures.
      console.log("Auth0 error, delaying redirect to login:", error);
      const retryTimeoutId = window.setTimeout(() => { void loginWithRedirect(); }, 3000);
      return () => window.clearTimeout(retryTimeoutId);
    }
    void loginWithRedirect();
  }, [isAuthenticated, isLoading, loginWithRedirect, error, shared]);
  // ====================== //
  //                        //
  //   UI EVENT HANDLERS    //
  //                        //
  // ====================== //
  // ------------------------------------------------------ Navigation
  function handleEventDomain(domain: ValidViews) { setOpenDomain(domain); }
  function handleEventClose() { setOpenDomain(null); }
  // ------------------------------------------------------ Account
  function handleEventLogout() {
    localStorage.clear();
    void logout({ logoutParams: { returnTo: window.location.origin } });
    window.location.reload();
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
  return <><ToastContainer position="top-right"/><PlannerNavigation openDomain={openDomain} accountName={user?.name} shared={shared} onEventDomain={handleEventDomain} onEventClose={handleEventClose} onEventLogout={handleEventLogout}/></>;
}
