import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { Signal } from "../../signal-polyfill/dist";
import { Validator } from "./types";

// See: https://github.com/proposal-signals/signal-polyfill
let needsEnqueue = true;

const w = new Signal.subtle.Watcher(() => {
  if (needsEnqueue) {
    needsEnqueue = false;
    queueMicrotask(processPending);
  }
});

function processPending() {
  needsEnqueue = true;

  for (const s of w.getPending()) {
    s.get();
  }

  w.watch();
}

export function effect(callback: any) {
  let cleanup: any;

  const computed = new Signal.Computed(() => {
    typeof cleanup === "function" && cleanup();
    cleanup = callback();
  });

  w.watch(computed);
  computed.get();

  return () => {
    w.unwatch(computed);
    typeof cleanup === "function" && cleanup();
  };
}

type Definition<T> = {
  initialValue: any;
  dependencies?: Array<keyof T>;
  computeValue?: (dependencySignal: Signal.State<any>) => Signal.Computed<any>;
  validators: Validator[];
};

type SchemaDefinition<T> = {
  [K in keyof T]: Definition<T>;
};

export type ReactSignalsFormType<T> = {
  schema: SchemaDefinition<T>;
};

type SignalFormMember = {
  signal: Signal.State<any>;
  computed: Signal.Computed<any>;
  errors: Array<string>;
};

type SignalForm<T> = {
  [K in keyof T]: SignalFormMember;
};

const useSignals = <T extends Record<string, any>>(
  form: ReactSignalsFormType<T>,
  cb: (state: SignalForm<T>, currentValue: T) => void,
) => {
  const shape = Object.keys(form.schema);
  const roots = Object.entries(form.schema)
    .filter(([, definition]) => (definition.dependencies ?? []).length === 0)
    .map(([key]) => key);
  const dependencies = shape.filter((key) => !roots.includes(key));

  // Map the root nodes first because nodes that have dependencies depend on them
  const state = roots.reduce((acc, key) => {
    const atom = form.schema?.[key];
    const signal = new Signal.State(atom?.initialValue);

    return {
      ...acc,
      [key]: {
        signal,
        computed: new Signal.Computed(() => undefined),
        errors: [],
      } satisfies SignalFormMember,
    };
  }, {} as SignalForm<T>);

  for (const key of dependencies) {
    const atom = form.schema?.[key];
    const signal = new Signal.State(atom?.initialValue);

    const dependencyKey = (atom.dependencies ?? [])[0];
    const dependencySignal = state[dependencyKey].signal;

    if (typeof atom.computeValue !== "function") {
      continue;
    }

    const computed = atom.computeValue(dependencySignal);

    // @ts-expect-error todo
    state[key] = {
      signal,
      computed,
      errors: [],
    } satisfies SignalFormMember;
  }

  return effect(() => {
    const currentValue = { ...state } as T;

    shape.forEach((key) => {
      const atom = form.schema?.[key];
      const curValue =
        typeof atom.computeValue === "function"
          ? state[key].computed.get()
          : state[key].signal.get();

      // Run validations
      const errors = atom.validators
        .map((validator) => validator(curValue))
        .filter(Boolean);
      // @ts-expect-error todo
      currentValue[key] = curValue;
      // @ts-expect-error todo
      state[key].errors = errors;
    });

    cb(state, currentValue);
  });
};

type Context<T> =
  | {
      state: SignalForm<T>;
      value: T;
    }
  | undefined;

const MyContext = createContext<Context<any>>(undefined);

const MyProvider = <T extends Record<string, any>>({
  form,
  children,
}: {
  form: ReactSignalsFormType<T>;
  children: ReactNode;
}) => {
  const [state, setState] = useState<SignalForm<T>>();
  const [value, setValue] = useState<T>();

  useEffect(() => {
    useSignals(form, (currentState, currentValue) => {
      setState(currentState);
      setValue(currentValue);
    });
  }, []);

  return (
    // @ts-expect-error todo
    <MyContext.Provider value={{ state, value }}>{children}</MyContext.Provider>
  );
};

function useGenericContext<T>() {
  const context = useContext(MyContext as React.Context<Context<T>>);
  if (context === undefined) {
    throw new Error(
      "useGenericContext must be used within a GenericContextProvider",
    );
  }
  return context;
}

const useForm = <T,>() => useGenericContext<T>();

export { useForm, MyProvider };
