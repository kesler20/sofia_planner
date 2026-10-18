import NavbarComponent from "./components/navbar/NavbarComponent";
import Pages from "./pages/Pages";
import { HashRouter } from "react-router-dom";
import "./styles/index.css";
import Auth0ProviderWithHistory from "./Auth0Provider";
import PlannerTheme from "./components/PlannerTheme";
import AccountSession from "./auth/AccountSession";

// ============================================================ //
//                                                              //
//   APP                                                        //
//                                                              //
//   Owns authenticated application routing under the shared theme.
//   User events flow to the owning page container.              //
//                                                              //
// ============================================================ //
export default function App() {
  // ====================== //
  //                        //
  //   STATE VARIABLES      //
  //                        //
  // ====================== //

  // ====================== //
  //                        //
  //   OBSERVE STATE        //
  //                        //
  // ====================== //

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

  function handleEventSkip(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    document.getElementById("main-content")?.focus();
  }

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
  return (
    <PlannerTheme><div className="min-h-screen w-full">
      {/* Authenticated routing */}
      <HashRouter>
        <Auth0ProviderWithHistory>
          <AccountSession>
          <a className="sofia-skip-link" href="#main-content" onClick={handleEventSkip}>Skip to content</a>
          {/* Account navigation */}
          <NavbarComponent />
          {/* Current account page */}
          <main id="main-content" tabIndex={-1} className="sofia-page-content">
            <Pages />
          </main>
          </AccountSession>
        </Auth0ProviderWithHistory>
      </HashRouter>
    </div></PlannerTheme>
  );
}
