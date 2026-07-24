import { z } from "zod";

// ----------------------------//
//                             //
//       SOFIA DIET TYPES      //
//                             //
// ----------------------------//

export const FoodSchema = z.object({
  name: z.string(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  cost: z.number().nullable(),
  vendor: z.string().nullable(),
  amount: z.number(),
});

export type FoodAttributeType = keyof z.infer<typeof FoodSchema>;

export const MealSchema = z.object({
  name: z.string(),
  foods: z.array(FoodSchema),
  // manual 1-10 rating on the assembled meal, not on individual foods
  tasteScore: z.number().min(1).max(10),
});

export type MealAttributeType = keyof z.infer<typeof MealSchema>;

export const WeekPlanSchema = z.object({
  Monday: z.array(MealSchema),
  Tuesday: z.array(MealSchema),
  Wednesday: z.array(MealSchema),
  Thursday: z.array(MealSchema),
  Friday: z.array(MealSchema),
  Saturday: z.array(MealSchema),
  Sunday: z.array(MealSchema),
});

export type WeekdayType = keyof z.infer<typeof WeekPlanSchema>;

export const DietSchema = z.object({
  name: z.string(),
  active: z.boolean(),
  // set when Kesler finalizes the week's plan; Cristiano Ronaldo (the
  // Dietitian agent) reads this to trigger the MFP push-back and
  // vendor-specific shopping passes, then leaves it alone
  finalizedAt: z.string().nullable(),
  meals: WeekPlanSchema,
});

// ----------------------------//
//                             //
//       HTTP MESSAGE TYPES    //
//                             //
// ----------------------------//

export const NoSQLDbServiceResourceSchema = z.object({
  resourceName: z.string(),
  resourceContent: z.string(),
});

export const NoSQLDbServiceParamSchema = z.object({
  topic: z.string(),
  resourceName: z.string().optional(),
});

// ------------------------ //
//                          //
//       EXPORTS            //
//                          //
// -------------------------//

export type FoodType = z.infer<typeof FoodSchema>;
export type MealType = z.infer<typeof MealSchema>;
export type WeekPlanType = z.infer<typeof WeekPlanSchema>;
export type DietType = z.infer<typeof DietSchema>;
export type NoSQLDbServiceResourceType = z.infer<
  typeof NoSQLDbServiceResourceSchema
>;
export type NoSQLDbServiceParamType = z.infer<typeof NoSQLDbServiceParamSchema>;
