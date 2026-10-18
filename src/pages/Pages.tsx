import * as React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Diet from "./diet/Diet";
import BudgetsPage from "./finance/BudgetsPage";
import MonitoringPage from "./finance/MonitoringPage";
import SpendingRankingsPage from "./finance/SpendingRankingsPage";
import InvestmentPlannerPage from "./finance/InvestmentPlannerPage";
import PersonalRecordsPage from "./health/PersonalRecordsPage";
import BurnupPage from "./health/BurnupPage";
import ControlChartsPage from "./health/ControlChartsPage";
import DietAnalyticsPage from "./diet/DietAnalyticsPage";

type PageMetaData = {
  name: string;
  link: string;
  pageComponent: React.ComponentType;
  shareComponent?: React.ComponentType;
};

export type ValidViews = "diet" | "finance" | "health";
export const validViewsValues = ["diet", "finance", "health"];

export type Pages = {
  [K in ValidViews]: PageMetaData[];
};

/**
 * a list containing the metadata of the pages, including { name, pageIcon and link, pageComponent }
 */
export const pages: Pages = {
  health: [
    { name: "Gym Personal Records", link: "/health/records", pageComponent: PersonalRecordsPage },
    { name: "Burnup", link: "/health/burnup", pageComponent: BurnupPage },
    { name: "Control charts", link: "/health/control", pageComponent: ControlChartsPage },
  ],
  finance: [
    { name: "Monitoring", link: "/finance/monitoring", pageComponent: MonitoringPage },
    { name: "Spending rankings", link: "/finance/rankings", pageComponent: SpendingRankingsPage },
    {
      name: "Plan Investments",
      link: "/investments",
      pageComponent: InvestmentPlannerPage,
    },
    {
      name: "Plan Finances",
      link: "/finance",
      pageComponent: BudgetsPage,
    },
  ],
  diet: [
    { name: "Monitoring", link: "/diet/monitoring", pageComponent: DietAnalyticsPage },
    {
      name: "Plan Diet",
      link: "/diet",
      pageComponent: Diet,
    },
    { name: "Meal Rankings", link: "/diet/rankings", pageComponent: DietAnalyticsPage },
    { name: "Calorie Calculator", link: "/diet/calculator", pageComponent: DietAnalyticsPage },
  ],
};

export default function Pages() {
  return (
    <Routes>
      <Route path="/diet/cheat-meals/*" element={<Navigate to="/diet" replace />} />
      <Route path="/finance/forecasting/*" element={<Navigate to="/finance/monitoring" replace />} />
      <Route path="/home/*" element={<Navigate to="/diet/monitoring" replace />} />
      <Route index element={<Navigate to="/diet/monitoring" replace />} />
      <Route path="/analytics/*" element={<Navigate to="/diet/monitoring" replace />} />
      <Route path="/health/configuration" element={<Navigate to="/diet/monitoring" replace />} />
      {["/edit-meal", "/meal", "/dishes"].map(path => <Route key={path} path={path} element={<Navigate to="/diet" replace />} />)}
      {Object.values(pages)
        .flat()
        .map((pageMetaData, index) => {
          const PageComponent = pageMetaData.pageComponent;
          const ShareComponent = pageMetaData.shareComponent;

          return (
            <React.Fragment key={index}>
              <Route path={pageMetaData.link} element={<PageComponent />} />
              {ShareComponent && (
                <Route
                  key={`${index}-share`}
                  path={`${pageMetaData.link}/share/:identifier`}
                  element={<ShareComponent />}
                />
              )}
            </React.Fragment>
          );
        })}
    </Routes>
  );
}
