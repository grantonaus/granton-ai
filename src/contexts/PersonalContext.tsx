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
  hasCompanyDetails: boolean;
  setHasCompanyDetails: (val: boolean) => void;
}

const PersonalContext = createContext<PersonalContextType | undefined>(
  undefined
);

interface PersonalProviderProps {
  initialHasPersonalDetails: boolean;
  initialHasCompanyDetails: boolean;
  children: ReactNode;
}

export function PersonalProvider({
  initialHasPersonalDetails,
  initialHasCompanyDetails,
  children,
}: PersonalProviderProps) {
  // Initialize from the prop instead of always `false`
  const [hasPersonalDetails, setHasPersonalDetails] = useState(
    initialHasPersonalDetails
  );
  const [hasCompanyDetails, setHasCompanyDetails] = useState(
    initialHasCompanyDetails
  );

  return (
    <PersonalContext.Provider
      value={{ hasPersonalDetails, setHasPersonalDetails, hasCompanyDetails, setHasCompanyDetails }}
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
