export type SignalsForm = {
  counter: number;
  computedParity: string;
  ourNumber: number;
};

export type Validator = (value: any) => string | undefined;
