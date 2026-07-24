import * as React from "react";
import { Routes, Route } from "react-router-dom";
import Foods from "./diet/Dishes";
import Dish from "./diet/Dish";
import Diet from "./diet/Diet";
import Meal from "./diet/Meal";
import BudgetsPage from "./finance/BudgetsPage";
import VoiceEmailReader from "./inbox/VoiceEmailReader";
import TaskTriage from "./inbox/TaskTriage";
import InvestmentPlannerPage from "./finance/InvestmentPlannerPage";
import BodyFatPlanner from "./diet/BodyFatPlanner";

type PageMetaData = {
  name: string;
  link: string;
  pageComponent: React.ReactNode;
  shareComponent?: React.ReactNode;
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
      pageComponent: <InvestmentPlannerPage />,
    },
    {
      name: "Plan Finances",
      link: "/finance",
      pageComponent: <BudgetsPage />,
    },
  ],
  diet: [
    {
      name: "Body Fat Planner",
      link: "/body-fat-planner",
      pageComponent: <BodyFatPlanner />,
    },
    {
      name: "Plan Diet",
      link: "/diet",
      pageComponent: <Diet />,
    },
    {
      name: "Edit Foods",
      link: "/dishes",
      pageComponent: <Foods />,
    },
    {
      name: "Add Food",
      link: "/dish",
      pageComponent: <Dish />,
    },
    {
      name: "Add Meal",
      link: "/meal",
      pageComponent: <Meal />,
    },
  ],
  inbox: [
    {
      name: "Voice Reader",
      link: "/inbox",
      pageComponent: <VoiceEmailReader />,
    },
    {
      name: "Task Triage",
      link: "/task-triage",
      pageComponent: <TaskTriage />,
    },
  ],
};

export default function Pages() {
  return (
    <Routes>
      <Route path="/" element={<Diet />} />
      {Object.values(pages)
        .flat()
        .map((pageMetaData, index) => {
          return (
            <React.Fragment key={index}>
              <Route path={pageMetaData.link} element={pageMetaData.pageComponent} />
              {pageMetaData.shareComponent && (
                <Route
                  key={`${index}-share`}
                  path={`${pageMetaData.link}/share/:identifier`}
                  element={pageMetaData.shareComponent}
                />
              )}
            </React.Fragment>
          );
        })}
    </Routes>
  );
}
