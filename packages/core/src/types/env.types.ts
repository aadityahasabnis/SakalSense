// Environment type definitions for type-safe configuration across the monorepo
// Separate exports allow tree-shaking and explicit imports in consuming files

// NodeEnv: Restricts environment to valid values only, preventing typos and invalid states
export type NodeEnv = 'development' | 'production' | 'test';
