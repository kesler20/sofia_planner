import * as React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { z } from "zod";
import { AccountContext } from "./accountContext";
import { activateResourceSession } from "./resourceSession";
import { rememberPersonal } from "../entry/appMode";
import LoadingAnimation from "../components/LoadingAnimation";
import { authRedirectUri, safeReturnTo } from "./authConfig";

// ============================================================ //
//                                                              //
//   ACCOUNT SESSION                                            //
//                                                              //
//   Resolve the server-authorized namespace before mounting     //
//   pages. Identity changes discard all prior page state.      //
//                                                              //
// ============================================================ //
export default function AccountSession(props: { children: React.ReactNode }) {
  // ====================== //
  //                        //
  //   STATE VARIABLES      //
  //                        //
  // ====================== //
  const { isLoading, isAuthenticated, user, error, getAccessTokenSilently, loginWithRedirect } = useAuth0();
  const location = useLocation();
  const [session, setSession] = React.useState<{ subject: string; account: string } | null>(null);
  const [failed, setFailed] = React.useState(false);
  const redirectStarted = React.useRef(false);
  const subject = user?.sub;
  // ====================== //
  //                        //
  //   OBSERVE STATE        //
  //                        //
  // ====================== //
  console.debug("account session", { isLoading, isAuthenticated, ready: !!session, failed });
  // ====================== //
  //                        //
  //   SIDE EFFECTS         //
  //                        //
  // ====================== //
  React.useEffect(() => {
    if (isLoading || isAuthenticated || error || redirectStarted.current) return;
    redirectStarted.current = true;
    void loginWithRedirect({ appState: { returnTo: safeReturnTo(location.pathname + location.search) } })
      .catch(() => { setFailed(true); });
  }, [isLoading, isAuthenticated, error, loginWithRedirect, location.pathname, location.search]);

  React.useEffect(() => {
    if (!isAuthenticated || !subject) return;
    let active = true;
    let deactivate: (() => void) | undefined;
    setFailed(false);
    const loadAccount = async () => {
      try {
        const token = await getAccessTokenSilently();
        const root = import.meta.env.VITE_PROD_BACKEND_URL.replace(/\/resources\/?$/, "");
        const response = await axios.get(`${root}/v1/account`, { headers: { Authorization: `Bearer ${token}` } });
        const account = z.object({ topic: z.string().regex(/^[A-Za-z0-9_.@-]+$/) }).parse(response.data).topic;
        if (!active) return;
        deactivate = activateResourceSession({ account, getToken: async () => {
          try { return await getAccessTokenSilently(); }
          catch { if (active) setFailed(true); throw new Error("Account sign-in must be renewed"); }
        } });
        rememberPersonal();
        setSession({ subject, account });
      } catch {
        if (active) { setFailed(true); console.warn("Account authorization failed"); }
      }
    };
    void loadAccount();
    return () => { active = false; deactivate?.(); };
  }, [isAuthenticated, subject, getAccessTokenSilently]);
  // ====================== //
  //                        //
  //   UI EVENT HANDLERS    //
  //                        //
  // ====================== //
  function handleEventSignIn() {
    setFailed(false);
    void loginWithRedirect({ authorizationParams: { redirect_uri: authRedirectUri(), prompt: "login" }, appState: { returnTo: safeReturnTo(location.pathname + location.search) } })
      .catch(() => { setFailed(true); });
  }
  // ====================== //
  //                        //
  //   UTILS METHODS        //
  //                        //
  // ====================== //
  const ready = isAuthenticated && subject && session?.subject === subject;
  // ====================== //
  //                        //
  //   UI COMPONENTS        //
  //                        //
  // ====================== //
  if (error || failed) return <main className="mx-auto max-w-xl space-y-4 p-6"><h1 className="text-2xl font-semibold">Sign-in could not be completed</h1><p role="alert">Your account data has not been loaded. Personal access is restricted to this planner’s owner.</p><button type="button" className="rounded-xl border px-4 py-2" onClick={handleEventSignIn}>Sign in again</button></main>;
  if (isLoading || !ready) return <LoadingAnimation />;
  return <AccountContext.Provider key={`${subject}/${session.account}`} value={session.account}>{props.children}</AccountContext.Provider>;
}
