import React from "react";
import { MyProvider, ReactSignalsFormType } from "./engine";
import { Signal } from "../../signal-polyfill/dist";
import { SignalsForm } from "./types";
import { MyForm } from "./MyForm";
import { minValue } from "./validators/minValue";
import { maxValue } from "./validators/maxValue";

export const App = () => {
  const form: ReactSignalsFormType<SignalsForm> = {
    schema: {
      counter: {
        initialValue: 0,
        validators: [],
      },
      computedParity: {
        initialValue: "",
        dependencies: ["counter"],
        validators: [],
        computeValue: (dependencySignal) => {
          const isEven = new Signal.Computed(
            () => (dependencySignal.get() & 1) == 0,
          );
          return new Signal.Computed(() => (isEven.get() ? "even" : "odd"));
        },
      },
      ourNumber: {
        initialValue: 0,
        validators: [minValue(0), maxValue(3)],
      },
    },
  };

  return (
    <MyProvider form={form}>
      <MyForm />
    </MyProvider>
  );
};
