import { Link } from "react-router-dom";
import { pages, ValidViews, validViewsValues } from "../../pages/Pages";
import { useAuth0 } from "@auth0/auth0-react";
import React from "react";
import { IoMdLogOut } from "react-icons/io";
import { MenuItem, Select } from "@mui/material";
import { ToastContainer } from "react-toastify";
import { useCachedValue } from "../../utils";

export default function NavbarComponent() {
  const [currentView, setCurrentView] = useCachedValue<ValidViews>(
    "global",
    "shopping",
    "currentView"
  );
  const [currentPage, setCurrentPage] = useCachedValue<string>(
    "global",
    pages[currentView][0].link,
    "currentPage"
  );
  const { logout, user, isAuthenticated, isLoading, loginWithRedirect } = useAuth0();

  // ====================== //
  //                        //
  //   SIDE EFFECTS         //
  //                        //
  // ====================== //

  React.useEffect(() => {
    if (isAuthenticated && user) {
      localStorage.setItem(
        "global/email",
        user.email?.replace("@", "_at_") || "guest"
      );
    }
  }, [isAuthenticated, user]);

  React.useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      loginWithRedirect();
    }
  }, [isAuthenticated, isLoading, loginWithRedirect]);

  // grab the current url path to see if its a shared link
  if (window.location.pathname.includes("/share/")) {
    return (
      <div className="flex w-full items-center justify-center h-18 pt-4">
        {/* Alert messages */}
        <ToastContainer position="top-right" />

        {/* This is the title and the logo */}
        <h1 className="text-[30px] font-bold site-title">sofiaPlanner</h1>
      </div>
    );
  }

  return (
    // The first line contains the seperation between the navbar and the links drop down
    <div className="flex flex-col items-center justify-center w-full h-18 mb-6 pt-4">
      {/* Alert messages */}
      <ToastContainer position="top-right" />
      {/* The second line contains the logo, title and the hamburger menu */}
      <div className="w-full flex items-center justify-evenly">
        <div className="flex gap-4">
          {/* These are the two dropdown menus */}
          <Select
            className="h-8"
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={currentView}
            onChange={(event) => setCurrentView(event.target.value as ValidViews)}
          >
            {validViewsValues.map((view, index) => (
              <MenuItem key={index} value={view}>
                {view}
              </MenuItem>
            ))}
          </Select>

          <Select
            className="h-8"
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={currentPage}
            onChange={(event) => setCurrentPage(event.target.value as string)}
          >
            {pages[currentView].map((pageMetaData, index) => (
              <MenuItem key={index} value={pageMetaData.link}>
                <Link to={pageMetaData.link}>{pageMetaData.name}</Link>
              </MenuItem>
            ))}
          </Select>
        </div>

        {/* This is the title and the logo */}
        <h1 className="text-[30px] font-bold site-title hidden md:block ">
          sofiaPlanner
        </h1>

        {/* This is the user profile */}
        <div className="flex items-center justify-center">
          <p className="hidden md:block text-gray-400 mr-2">Hi {user?.name} ✨</p>
          <button
            title={"log out"}
            onClick={() => {
              localStorage.clear();
              logout({ logoutParams: { returnTo: window.location.origin } });
              window.location.reload();
            }}
          >
            <IoMdLogOut className="text-gray-400 cursor-pointer" />
          </button>
        </div>
      </div>
    </div>
  );
}
