import * as React from "react";
import type { CheatMealInput } from "../cheatMealsData";
import CustomForm from "../../../components/forms/CustomForm";

// ============================================================ //
//                                                              //
//   CHEAT MEAL FORM                                            //
//                                                              //
//   Original purple meal card inside the Plan Diet workspace.  //
//   Emits authored inputs and saves to the Diet page owner.    //
//                                                              //
// ============================================================ //

const fields = [{ key: "name", label: "Meal name", text: true }, { key: "calories", label: "Calories (kcal)" }, { key: "protein", label: "Protein (g)" }, { key: "carbs", label: "Carbs (g)" }, { key: "fat", label: "Fat (g)" }, { key: "cost", label: "Cost (£)" }, { key: "amount", label: "Amount (g)" }, { key: "vendor", label: "Vendor name", text: true }] as const;

export function CheatMealForm(props: { input: CheatMealInput; saving: boolean; message: string; onEventInput: (input: CheatMealInput) => void; onEventSave: (event: React.FormEvent) => void }) {
  return <section aria-label="Create cheat meal" className="w-full py-12">
    <div className="relative isolate mx-auto my-5 w-[280px] max-w-full">
      <div aria-hidden="true" className="absolute left-1/2 top-1/2 -z-10 h-[350px] w-[250px] -translate-x-1/2 -translate-y-1/2 rotate-[15deg] rounded-[15px] bg-[rgb(144,80,204)] shadow-[20px_20px_20px_rgb(155,155,155)]" />
      <CustomForm longer header={<h2 className="mt-6 px-4 text-lg font-semibold">Create cheat meal</h2>}
        sections={fields.map(field => ({ name: field.label, value: props.input[field.key] ?? "", required: field.key === "name", inputType: "text" in field ? "text" as const : "number" as const, placeholder: field.key === "name" ? "Meal name" : "Unknown", onChange: event => props.onEventInput({ ...props.input, [field.key]: "text" in field ? event.target.value || null : event.target.value === "" ? null : Number(event.target.value) }) }))}
        disabled={props.saving} submitText={props.saving ? "Saving…" : "Save meal"} onSubmit={props.onEventSave} />
    </div>
    {props.message && <p role="alert" className="mx-auto mt-8 max-w-lg text-center text-sm text-red-700">{props.message}</p>}
  </section>;
}
