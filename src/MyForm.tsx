import React from "react";
import { useForm } from "./engine";
import { SignalsForm } from "./types";

export const MyForm = () => {
  const { state, value } = useForm<SignalsForm>();

  if (!state) {
    return null;
  }

  return (
    <>
      <div>
        <h3>Showcasing computed value</h3>
        <div>
          <span>Counter: </span>
          <span>{value.counter}</span>
        </div>
        <div>
          <span>Computed: </span>
          <span>{value.computedParity}</span>
        </div>
        <button
          onClick={() => state.counter.signal.set(value.counter + 1)}
          className="alittleless-top-margin"
        >
          Increment
        </button>
      </div>
      <div className="some-top-margin">
        <h3>Showcasing validation</h3>
        <div className="input-and-label">
          <label htmlFor="req">Number between 0 and 3</label>
          <input
            id="req"
            type="number"
            value={value.ourNumber}
            onChange={(event) => state.ourNumber.signal.set(event.target.value)}
          />
          <p className="error">{state.ourNumber.errors[0] ?? ""}</p>
        </div>
      </div>
    </>
  );
};
