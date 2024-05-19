import { Validator } from "../types";

export const minValue: (min: number) => Validator =
  (min: number) => (value: number) =>
    value >= min ? undefined : `Min value is ${min}`;
