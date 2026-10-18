import { z } from "zod";

export type CategoryType = "income" | "expense";
export type Category = {
  name: string;
  type: CategoryType;
  sections: { name: string; value: number }[];
  isVariable?: boolean;
  variableId?: string;
};
export type Months =
  | "January"
  | "February"
  | "March"
  | "April"
  | "May"
  | "June"
  | "July"
  | "August"
  | "September"
  | "October"
  | "November"
  | "December";
export type Finances = Record<
  Months,
  {
    categories: Category[];
  }
>;

const sectionSchema = z
  .object({ name: z.string(), value: z.number().finite() })
  .passthrough();
const categorySchema = z
  .object({
    name: z.string(),
    type: z.enum(["income", "expense"]),
    sections: z.array(sectionSchema),
    isVariable: z.boolean().optional(),
    variableId: z.string().optional(),
  })
  .passthrough();
const monthSchema = z
  .object({ categories: z.array(categorySchema) })
  .passthrough();
export const financesSchema = z
  .object({
    January: monthSchema,
    February: monthSchema,
    March: monthSchema,
    April: monthSchema,
    May: monthSchema,
    June: monthSchema,
    July: monthSchema,
    August: monthSchema,
    September: monthSchema,
    October: monthSchema,
    November: monthSchema,
    December: monthSchema,
  })
  .passthrough();
export const validateFinances = (value: unknown): Finances =>
  financesSchema.parse(value);
