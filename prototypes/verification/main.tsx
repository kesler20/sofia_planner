import "../offline";
import * as React from "react";
import { createRoot } from "react-dom/client";
import axios, { AxiosError } from "axios";
import PlannerTheme from "../../src/components/PlannerTheme";
import BudgetsPage from "../../src/pages/finance/BudgetsPage";
import InvestmentPlannerPage from "../../src/pages/finance/InvestmentPlannerPage";
import { useStoredValue } from "../../src/utils";
import { AnalyticsCard, AnalyticsSelect, SegmentedControl } from "../../src/components/analytics/AnalyticsControls";
import DonutChart from "../../src/components/charts/DonutChart";
let writes=0;
let reads=0;
const months=["January","February","March","April","May","June","July","August","September","October","November","December"];
const budget=Object.fromEntries(months.map(month=>[month,{categories:[{name:"Salary",type:"income",sections:[{name:"Salary",value:3000}]},{name:"Food",type:"expense",sections:[{name:"Groceries",value:400}]}]}]));
const scenario=new URLSearchParams(location.search).get("scenario") ?? "failed";
axios.defaults.adapter=async config=>{
 if(config.method!=="get") {writes++; document.getElementById("writes")!.textContent=String(writes); return {data:true,status:200,statusText:"OK",headers:{},config};}
 reads++;
 await new Promise(resolve=>setTimeout(resolve,400));
 const key=config.url?.split("/").pop();
 if(scenario==="failed" || scenario==="budget-failed" || (scenario==="investment-failed" && key==="monthlyBalance")) throw new AxiosError("Synthetic read failure","ERR_NETWORK",config);
 if(scenario==="malformed") return {data:"not JSON",status:200,statusText:"OK",headers:{},config};
 if(scenario==="missing") throw new AxiosError("Synthetic absent resource","ERR_BAD_REQUEST",config,undefined,{data:null,status:404,statusText:"Missing",headers:{},config});
 const value=key==="monthlyBalance"?budget:key==="monthly_fixed_investment"?[500]:key==="investment_params"?{principal:10000,monthlyContribution:500,years:30,inflationRate:.025,dividendYield:.02}:{count:7};
 return {data:JSON.stringify(value),status:200,statusText:"OK",headers:{},config};
};
function Storage() {
 const [value,setValue,loading,error]=useStoredValue("synthetic-user",{count:0},"manual_check");
 return <AnalyticsCard><p>{loading?"Loading":error??`Loaded count ${value.count}`}</p><button type="button" onClick={()=>setValue(current=>({count:current.count+1}))}>Edit count</button><p>Read requests {reads}</p></AnalyticsCard>;
}
function Verification(){
 const [selected,setSelected]=React.useState("one");
 return <main className="space-y-5 p-5"><h1 className="text-2xl">Sofia cleanup verification</h1><p>Scenario {scenario}. Synthetic writes <output id="writes">0</output></p><nav className="flex flex-wrap gap-3">{["failed","success","missing","malformed","budget-success","budget-failed","investment-failed","investment-success","components"].map(name=><a key={name} href={`?scenario=${name}`} className="text-blue-700">{name}</a>)}</nav>{scenario.startsWith("budget")?<BudgetsPage/>:scenario.startsWith("investment")?<InvestmentPlannerPage/>:scenario==="components"?<AnalyticsCard><AnalyticsSelect label="Shared selector" value={selected} options={[{id:"one",name:"One"},{id:"two",name:"Two"}]} onEventChange={setSelected}/><SegmentedControl label="Shared segments" value={selected} options={[{value:"one",label:"One"},{value:"two",label:"Two"}]} onEventChange={setSelected}/><DonutChart rows={[{id:"one",name:"One",value:60,colour:"#2563eb"},{id:"two",name:"Two",value:40,colour:"#9333ea"}]} height={240} innerRadius={65} outerRadius={95} formatValue={String}/></AnalyticsCard>:<Storage/>}</main>;
}
createRoot(document.getElementById("root")!).render(<PlannerTheme><Verification/></PlannerTheme>);
