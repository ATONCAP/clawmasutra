import { WrappersData, WrappersConfig } from "./wrappersConfigTypes";

export const loadWrappersFromJSON = async (): Promise<[WrappersData, WrappersConfig]> => {
  const wrappers = await import("../config/wrappers.json");
  const config = await import("../config/config.json");
  // Type assertions needed because JSON schema doesn't fully match TypeScript types
  // This is inherited from ton-scaffolding and works at runtime
  return [wrappers.default as unknown as WrappersData, config.default as unknown as WrappersConfig];
};
