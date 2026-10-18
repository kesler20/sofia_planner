import * as React from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import "../styles/index.css";

// ============================================================ //
//                                                              //
//   PLANNER THEME                                              //
//                                                              //
//   Shared app typography and Material theme for app and lab.   //
//   Wraps children without authentication or resource access.   //
//                                                              //
// ============================================================ //
const plannerTheme = createTheme({
  shape: { borderRadius: 8 },
  typography: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
  },
});

export default function PlannerTheme(props: { children: React.ReactNode }) {
  return <ThemeProvider theme={plannerTheme}>{props.children}</ThemeProvider>;
}
