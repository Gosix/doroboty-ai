import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { initialState, transition, currentPerson, type Action, type State } from "./model";
import { parseState, readState, saveState, type StoragePort } from "./storage";
import { isPostHogInitialized, posthog } from "@/app/analytics";
function browserStorage(): StoragePort | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
function useStore() {
  const [loaded] = useState(() => readState(browserStorage()));
  const [state, setState] = useState(loaded.state);
  const [issue, setIssue] = useState(loaded.issue);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(loaded.blocked);
  const latest = useRef(state);
  const identifiedPerson = useRef<{ id: string; name: string; role: string } | null | undefined>(
    undefined,
  );
  const person = currentPerson(state);
  function commit(next: State, replace = false) {
    latest.current = next;
    setState(next);
    setError("");
    if (blocked && !replace) return;
    try {
      saveState(browserStorage(), next);
      setIssue("");
      if (replace) setBlocked(false);
    } catch (e) {
      setIssue((e as Error).message);
    }
  }
  function run(action: Action) {
    try {
      commit(transition(latest.current, action));
      return true;
    } catch (e) {
      setError(
        e instanceof Error && e.name !== "ZodError"
          ? e.message
          : "Sprawdź poprawność i długość wprowadzonych danych.",
      );
      return false;
    }
  }
  function importState(raw: string) {
    try {
      const next = parseState(raw);
      commit(next, true);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  }
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);
  useEffect(() => {
    if (!isPostHogInitialized) return;

    if (!person) {
      if (identifiedPerson.current) posthog.reset();
      identifiedPerson.current = null;
      return;
    }

    const nextIdentity = { id: person.id, name: person.name, role: person.role };
    if (
      identifiedPerson.current?.id === nextIdentity.id &&
      identifiedPerson.current.name === nextIdentity.name &&
      identifiedPerson.current.role === nextIdentity.role
    )
      return;
    if (identifiedPerson.current && identifiedPerson.current.id !== person.id) posthog.reset();
    posthog.identify(person.id, { name: person.name, role: person.role });
    identifiedPerson.current = nextIdentity;
  }, [person]);
  return {
    state,
    issue,
    error,
    blocked,
    original: loaded.original,
    run,
    importState,
    clearError: () => setError(""),
    reset: () => commit(initialState(), true),
  };
}
type Store = ReturnType<typeof useStore>;
const Context = createContext<Store | null>(null);
export function PrototypeProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function usePrototype() {
  const store = useContext(Context);
  if (!store) throw new Error("PrototypeProvider is required");
  return store;
}
