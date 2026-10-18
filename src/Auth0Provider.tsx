import * as React from "react";
import { Auth0Provider, type AppState } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { authConfig, authRedirectUri, safeReturnTo } from "./auth/authConfig";

// ============================================================ //
//                                                              //
//   AUTH0 PROVIDER                                             //
//                                                              //
//   Use the application base for OAuth callbacks and accept     //
//   only local route destinations after code/state validation. //
//                                                              //
// ============================================================ //

export default function Auth0ProviderWithHistory({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {

  // ====================== //
  //                        //
  //   STATE VARIABLES      //
  //                        //
  // ====================== //
  const navigate = useNavigate();
  const secure = window.isSecureContext && !!window.crypto?.subtle;
  // ====================== //
  //                        //
  //   OBSERVE STATE        //
  //                        //
  // ====================== //
  console.debug("authentication configuration", { secure, audienceConfigured: !!authConfig.audience });
  // ====================== //
  //                        //
  //   SIDE EFFECTS         //
  //                        //
  // ====================== //

  // ====================== //
  //                        //
  //   UI EVENT HANDLERS    //
  //                        //
  // ====================== //

  const handleEventRedirect = (appState?: AppState) => {
    // Auth0's code/state query parameters must be consumed before HashRouter navigation.
    window.history.replaceState({}, document.title, authRedirectUri());
    navigate(safeReturnTo(appState?.returnTo), { replace: true });
  };


  // ====================== //
  //                        //
  //   UTILS METHODS        //
  //                        //
  // ====================== //

  // ====================== //
  //                        //
  //   UI COMPONENTS        //
  //                        //
  // ====================== //
  if (!secure) return <main className="p-6" role="alert">Secure sign-in requires HTTPS or localhost. Open the HTTPS Sofia Planner address.</main>;
  if (!authConfig.audience) return <main className="p-6" role="alert">Account API authentication is not configured.</main>;

  return (
    <Auth0Provider
      domain={authConfig.domain}
      clientId={authConfig.clientId}
      onRedirectCallback={handleEventRedirect}
      useRefreshTokens={true}
      useRefreshTokensFallback={true}
      cacheLocation="memory"
      authorizationParams={{
        redirect_uri: authRedirectUri(),
        audience: authConfig.audience,
        connection: "google-oauth2",
      }}
    >
      {children}
    </Auth0Provider>
  );
}
