import { londonToday } from "../pages/finance/financeAnalyticsCalculations";
import { startOf, shiftPeriod, endOf } from "../pages/health/healthCalculations";
import { WEEKDAYS } from "../types";

// Entirely synthetic documentation fixtures. No account exports or captured observations.
const today = londonToday();
const date = new Date(`${today}T00:00:00Z`);
const year = date.getUTCFullYear();
const month = date.getUTCMonth();
const day = date.getUTCDate();
const stamp = `${today}T12:00:00Z`;
const iso = (d: Date) => d.toISOString().slice(0,10);
const days = (start: string, count: number) => Array.from({length:count},(_,i)=>iso(new Date(Date.parse(`${start}T00:00:00Z`)+i*86400000)));
const monthStart = iso(new Date(Date.UTC(year,month,1)));
const monthEnd = iso(new Date(Date.UTC(year,month+1,0)));
const week = startOf(today);
const dates = days(week,7);
const entities = ["Groceries","Eating out","Transport","Shopping","Subscriptions","Bills"].map((name,i)=>({id:`demo-${i}`,name}));
const expenseRows = days(monthStart,day).flatMap((date,i)=>entities.map((entity,j)=>({date,entity_id:entity.id,value:i%3===0 ? 1200+(5-j)*200 : 0,merchant:`Demo merchant ${j+1}`})));
const expenseRevision = "synthetic-expenses";
const expenses = {schema_version:1,revision:expenseRevision,available:true,observed_through:today,captured_at:stamp,coverage:[{start:monthStart,end:today}],entities,rows:expenseRows};
const view = (id:string,index:number) => {
 const start = iso(new Date(Date.UTC(year,index,1)));
 const count = new Date(Date.UTC(year,index+1,0)).getUTCDate();
 const observed = index===month?day:count;
 const budget = 50000;
 let spent = 0;
 const points = days(start,count).map((_,i)=> {const expense=i<observed && i%3===0?2200:0;if(i<observed)spent+=expense;return {index:i+1,expense:i<observed?expense:null,actual:i<observed?budget-spent:null,plan:budget*(1-(i+1)/count)};});
 return {observedDays:observed,partial:false,points,budget,spent,remaining:budget-spent,dailyRate:spent/observed,periodRate:spent/observed*7,remainingRate:(budget-spent)/Math.max(1,count-observed)*7,plannedDailyRate:budget/count,plannedPeriodRate:budget/count*7,breakdown:[{name:"Demo Market",value:spent*.55},{name:"Demo Foods",value:spent*.3},{name:"Other",value:spent*.15}],observedThrough:index===month?today:iso(new Date(Date.UTC(year,index+1,0))),complete:index<month,id};
};
const finance = {schema_version:1,revision:"synthetic-monitoring",generated_at:stamp,as_of:today,input_revision:expenseRevision,views:Object.fromEntries(entities.map(entity=>[entity.id,{months:Array.from({length:12},(_,i)=>view(entity.id,i)),year:{...view(entity.id,month),points:Array.from({length:12},(_,i)=>({index:i+1,expense:i<=month?16000:null,actual:i<=month?600000-16000*(i+1):null,plan:600000-50000*(i+1)})),budget:600000,spent:16000*(month+1),remaining:600000-16000*(month+1)}}]))};
const categories = entities.map((entity,i)=>({id:entity.id,name:entity.name,net_total:(6-i)*8000,positive_share:(6-i)/21,cumulative_share:((i+1)*(12-i)/2)/21,merchants:Array.from({length:6},(_,j)=>({id:`merchant-${j}`,name:`Demo merchant ${j+1}`,net_total:(6-j)*1000,positive_share:(6-j)/21,cumulative_share:((j+1)*(12-j)/2)/21}))}));
const rankings = {schema_version:2,revision:"synthetic-rankings",input_revision:expenseRevision,available:true,captured_at:stamp,observed_through:today,coverage:[{start:monthStart,end:today}],periods:[{period:"month",start:monthStart,end:monthEnd,observed_coverage:[{start:monthStart,end:today}],coverage_status:"partial",net_total:168000,categories},{period:"year",start:`${year}-01-01`,end:`${year}-12-31`,observed_coverage:[{start:monthStart,end:today}],coverage_status:"partial",net_total:168000,categories}]};
const health = {schema_version:1,revision:"synthetic-health",generated_at:stamp,metrics:[{id:"steps",name:"Steps",unit:"steps",aggregation:"sum",source:"Synthetic"},{id:"weight",name:"Weight",unit:"kg",aggregation:"mean",source:"Synthetic"}],daily:dates.filter(d=>d<=today).map((date,i)=>({date,values:{steps:6500+i*200,weight:80-i*.1},muscle_volumes:{}})),exercises:[{id:"demo-squat",name:"Demo squat"}],exercise_daily_bests:Array.from({length:12},(_,i)=>({date:shiftPeriod(week,i-11),exercise_id:"demo-squat",load:60+i*2.5,body_weight:79,weight_measured_at:`${shiftPeriod(week,i-11)}T08:00:00Z`,lifted_at:`${shiftPeriod(week,i-11)}T12:00:00Z`})),periods:Array.from({length:12},(_,i)=>{const start=shiftPeriod(week,i-11);return {period:"week",start,end:endOf(start),controls:{weight:83-i*.25},records:[{exercise_id:"demo-squat",load:60+i*2.5,previous_pr:i?60+(i-1)*2.5:null,percentage:i?4:null,body_weight:80,lifted_at:`${start}T12:00:00Z`,weight_measured_at:`${start}T08:00:00Z`}]};}),burnup:[{period:"week",start:week,end:endOf(week),entity_id:"steps",observed_days:dates.filter(d=>d<=today).length,remaining_days:dates.filter(d=>d>today).length,partial:false,observed_through:today,accumulated:dates.filter(d=>d<=today).length*7000,daily_pace:7000,required_pace:8000,remaining:7000,target:49000,points:dates.map((date,i)=>({date,value:date<=today?(i+1)*7000:null,pace:(i+1)*7000}))}],latest_body:{muscle_mass:{value:60,measured_at:stamp},weight:{value:80,measured_at:stamp},body_fat:{value:22,measured_at:stamp}},weight_cutoff:80,observed_through:{steps:today,weight:today,strong:today},unmapped_exercises:[]};
const mealNames = ["Demo oats","Demo rice bowl","Demo pasta"];
const meals = mealNames.map((name,i)=>({catalogueId:`demo-meal-${i}`,name,tasteScore:8,convenienceScore:7,foods:[{name:`Demo ingredient ${i+1}`,calories:500+i*50,protein:35+i*5,carbs:60,fat:12,cost:2+i*.5,vendor:"Demo shop",amount:1,quantity:1}]}));
const diets = [{name:"Demo week",active:true,finalizedAt:null,meals:Object.fromEntries(WEEKDAYS.map(day=>[day,meals])),note:"Synthetic demonstration plan"}];
const monitor = (metric:"calories"|"protein") => ({observed_days:dates.filter(d=>d<=today).length,dates,points:dates.map((date,i)=>({label:date,plan:(i+1)*(metric==="calories"?2000:150),actual:date<=today?(i+1)*(metric==="calories"?1850:140):null})),covered:true,partial:false,actual:metric==="calories"?11100:840,dailyRate:metric==="calories"?1850:140,remaining:metric==="calories"?2900:210,requiredRate:metric==="calories"?2000:150});
const mealRanks=meals.map((meal,i)=>({id:meal.catalogueId,name:meal.name,components:{calories:500+i*50,protein:35+i*5,cost:2+i*.5,taste:8,convenience:7},servings:3,foods:[]}));
const dietAnalytics = {schema_version:1,revision:"synthetic-diet",input_revisions:{},generated_at:stamp,as_of:today,monitoring:{"Demo week":{calories:monitor("calories"),protein:monitor("protein")}},rankings:{catalogue:mealRanks,consumed:mealRanks},daily_balance:{date:today,burned:2350,intake:1850,balance:500,partial:false,fit_observed_through:today,diary_captured_at:stamp},calibration:{window:"rolling_7_days",method:"fit_average",observed_days:7,intake_days:7,paired_days:0,correction:null,maintenance:2350,dates:days(iso(new Date(date.getTime()-7*86400000)),7),points:[],available:true,intake:12950,expenditure:16450,balance:3500,predictedChange:-.45,observedChange:null}};
export const resources:Record<string,unknown>={finance_expense_actuals:expenses,finance_monitoring:finance,finance_spending_rankings:rankings,health_analytics:health,health_config:{schema_version:1,targets:{steps:{week:49000}},limits:{weight:{week:{lower:78,upper:84}}}},diets,meals,diet_analytics:dietAnalytics,diet_actuals:{schema_version:1,revision:"synthetic-diary",captured_at:stamp,days:[]}};

const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
resources.monthlyBalance = Object.fromEntries(monthNames.map(name => [name,{categories:[{name:"Income",type:"income",sections:[{name:"Salary",value:3000}]},{name:"Variable Costs",type:"expense",sections:[{name:"Groceries",value:300},{name:"Eating Out",value:150},{name:"Transport",value:100}]},{name:"Bills",type:"expense",sections:[{name:"Rent",value:950},{name:"Utilities",value:150}]}]}]));
