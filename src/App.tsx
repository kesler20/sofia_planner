import NavbarComponent from "./components/navbar/NavbarComponent";
import Pages from "./pages/Pages";
import { HashRouter } from "react-router-dom";
import "./styles/index.css";
import Auth0ProviderWithHistory from "./Auth0Provider";

export default function App() {
  
  return (
    <div className="min-h-screen w-full">
      <HashRouter>
        <Auth0ProviderWithHistory>
          <NavbarComponent />
          <Pages />
        </Auth0ProviderWithHistory>
      </HashRouter>
    </div>
  );
}
