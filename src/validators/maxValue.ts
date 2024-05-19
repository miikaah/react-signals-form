import { Validator } from "../types";

export const maxValue: (max: number) => Validator =
  (max: number) => (value: number) =>
    value < max ? undefined : `Max value is ${max}`;
