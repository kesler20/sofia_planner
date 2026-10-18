import NavbarComponent from "./components/navbar/NavbarComponent";
import Pages from "./pages/Pages";
import { HashRouter } from "react-router-dom";
import "./styles/index.css";
import Auth0ProviderWithHistory from "./Auth0Provider";
import PlannerTheme from "./components/PlannerTheme";

// ============================================================ //
//                                                              //
//   APP                                                        //
//                                                              //
//   Owns authenticated application routing under the shared theme.
//   User events flow to the owning page container.              //
//                                                              //
// ============================================================ //
export default function App() {
  function handleEventSkip(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    document.getElementById("main-content")?.focus();
  }
  return (
    <PlannerTheme><div className="min-h-screen w-full">
      <HashRouter>
        <Auth0ProviderWithHistory>
          <a className="sofia-skip-link" href="#main-content" onClick={handleEventSkip}>Skip to content</a>
          <NavbarComponent />
          <main id="main-content" tabIndex={-1} className="sofia-page-content">
            <Pages />
          </main>
        </Auth0ProviderWithHistory>
      </HashRouter>
    </div></PlannerTheme>
  );
}
