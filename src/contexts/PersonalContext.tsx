// contexts/PersonalContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

interface PersonalContextType {
  hasPersonalDetails: boolean;
  setHasPersonalDetails: (val: boolean) => void;
}

const PersonalContext = createContext<PersonalContextType | undefined>(
  undefined
);

interface PersonalProviderProps {
  initialHasPersonalDetails: boolean;
  children: ReactNode;
}

export function PersonalProvider({
  initialHasPersonalDetails,
  children,
}: PersonalProviderProps) {
  // Initialize from the prop instead of always `false`
  const [hasPersonalDetails, setHasPersonalDetails] = useState(
    initialHasPersonalDetails
  );

  return (
    <PersonalContext.Provider
      value={{ hasPersonalDetails, setHasPersonalDetails }}
    >
      {children}
    </PersonalContext.Provider>
  );
}

export function usePersonal() {
  const context = useContext(PersonalContext);
  if (!context) {
    throw new Error(
      "usePersonal must be used within a PersonalProvider"
    );
  }
  return context;
}
