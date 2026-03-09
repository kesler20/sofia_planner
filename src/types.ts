import { z } from "zod";

// ----------------------------//
//                             //
//       SOFIA DIET TYPES      //
//                             //
// ----------------------------//

export const DishSchema = z.object({
  name: z.string(),
  calories: z.number(),
  protein: z.number(),
  cost: z.number(),
  amount: z.number(),
  vendor: z.string(),
});

export type DishAttributeType = keyof z.infer<typeof DishSchema>;

export const DietSchema = z.object({
  Monday: z.array(DishSchema),
  Tuesday: z.array(DishSchema),
  Wednesday: z.array(DishSchema),
  Thursday: z.array(DishSchema),
  Friday: z.array(DishSchema),
  Saturday: z.array(DishSchema),
  Sunday: z.array(DishSchema),
});

export type WeekdayType = keyof z.infer<typeof DietSchema>;

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

export type DishType = z.infer<typeof DishSchema>;
export type DietType = z.infer<typeof DietSchema>;
export type NoSQLDbServiceResourceType = z.infer<
  typeof NoSQLDbServiceResourceSchema
>;
export type NoSQLDbServiceParamType = z.infer<typeof NoSQLDbServiceParamSchema>;
