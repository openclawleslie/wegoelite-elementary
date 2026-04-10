/**
 * Data Layer Types
 *
 * Base types and interfaces for the data access layer.
 * All data operations should use these types for consistency.
 */

/**
 * Standard result type for data operations
 */
export interface DataResult<T> {
  data: T | null;
  error: DataError | null;
}

/**
 * Result type for list operations with pagination
 */
export interface ListResult<T> {
  data: T[];
  error: DataError | null;
  count?: number;
}

/**
 * Data layer error types
 */
export enum DataErrorType {
  NOT_FOUND = "NOT_FOUND",
  VALIDATION = "VALIDATION",
  DATABASE = "DATABASE",
  NETWORK = "NETWORK",
  UNAUTHORIZED = "UNAUTHORIZED",
  UNKNOWN = "UNKNOWN",
}

/**
 * Data layer error structure
 */
export interface DataError {
  type: DataErrorType;
  message: string;
  details?: unknown;
}

/**
 * Query filter options
 */
export interface QueryFilter {
  field: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "in";
  value: unknown;
}

/**
 * Query sort options
 */
export interface QuerySort {
  field: string;
  ascending: boolean;
}

/**
 * Query pagination options
 */
export interface QueryPagination {
  limit: number;
  offset: number;
}

/**
 * Combined query options
 */
export interface QueryOptions {
  filters?: QueryFilter[];
  sort?: QuerySort;
  pagination?: QueryPagination;
}

/**
 * CRUD operation types
 */
export type CreateInput<T> = Omit<T, "id" | "created_at" | "updated_at">;
export type UpdateInput<T> = Partial<Omit<T, "id" | "created_at" | "updated_at">>;

/**
 * Data validator function type
 */
export type DataValidator<T> = (data: unknown) => T | null;

/**
 * Data transformer function type
 */
export type DataTransformer<TInput, TOutput> = (data: TInput) => TOutput;
