import Zod from "zod";

export const safeParse = <T>(
  ObjectSchema: Zod.Schema<T>,
  stringifiedObject: string
): T => {
  const parsedObject: T = JSON.parse(stringifiedObject);
  try {
    return ObjectSchema.parse(parsedObject);
  } catch (e) {
    console.error(e);
    return parsedObject;
  }
};
