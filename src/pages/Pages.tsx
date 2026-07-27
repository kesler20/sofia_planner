import * as React from "react";
import { Routes, Route } from "react-router-dom";
import Foods from "./diet/Dishes";
import Diet from "./diet/Diet";
import Meal from "./diet/Meal";
import EditMeal from "./diet/EditMeal";
import BudgetsPage from "./finance/BudgetsPage";
import VoiceEmailReader from "./inbox/VoiceEmailReader";
import TaskTriage from "./inbox/TaskTriage";
import InvestmentPlannerPage from "./finance/InvestmentPlannerPage";

type PageMetaData = {
  name: string;
  link: string;
  pageComponent: React.ComponentType;
  shareComponent?: React.ComponentType;
};

export type ValidViews = "diet" | "finance" | "inbox";
export const validViewsValues = ["diet", "finance", "inbox"];

export type Pages = {
  [K in ValidViews]: PageMetaData[];
};

/**
 * a list containing the metadata of the pages, including { name, pageIcon and link, pageComponent }
 */
export const pages: Pages = {
  finance: [
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
    {
      name: "Plan Diet",
      link: "/diet",
      pageComponent: Diet,
    },
    {
      name: "Edit Meal",
      link: "/edit-meal",
      pageComponent: EditMeal,
    },
    {
      name: "Create Meals",
      link: "/meal",
      pageComponent: Meal,
    },
    {
      name: "Edit Foods",
      link: "/dishes",
      pageComponent: Foods,
    },
  ],
  inbox: [
    {
      name: "Voice Reader",
      link: "/inbox",
      pageComponent: VoiceEmailReader,
    },
    {
      name: "Task Triage",
      link: "/task-triage",
      pageComponent: TaskTriage,
    },
  ],
};

export default function Pages() {
  return (
    <Routes>
      <Route index element={<Diet />} />
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
