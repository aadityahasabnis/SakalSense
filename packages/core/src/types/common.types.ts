// Common type definitions used across frontend and backend
// IFormData: Base type for all form/record data, using Record for flexibility with unknown value types
export type IFormData = Record<string, unknown>;

export type HelthType = 'healthy' | 'unhealthy';