import { createContext, useContext } from "react";
import type { ReactNode } from "react";

export type Direction = "ltr" | "rtl";

const DirectionContext = createContext<Direction | undefined>(undefined);

export type DirectionProviderProps = {

  dir?: Direction;

  direction?: Direction;
  children?: ReactNode;
};

function DirectionProvider({
  dir,
  direction,
  children,
}: DirectionProviderProps) {
  return (
    <DirectionContext.Provider value={direction ?? dir ?? "ltr"}>
      {children}
    </DirectionContext.Provider>
  );
}

function useDirection(localDir?: Direction): Direction {
  const contextDir = useContext(DirectionContext);
  return localDir ?? contextDir ?? "ltr";
}

export { DirectionProvider, useDirection };
