/**
 * Generic CRUD Factory
 *
 * Eliminates duplicated boilerplate across data modules.
 * Each module (students, teachers, classes, etc.) had identical
 * patterns for error handling, filtering, sorting, pagination,
 * and CRUD operations. This factory generates them all.
 */

import { supabase } from "../supabase";
import {
  DataResult,
  ListResult,
  DataError,
  DataErrorType,
  QueryOptions,
  CreateInput,
  UpdateInput,
} from "./types";

/**
 * Convert database error to DataError
 */
export function toDataError(error: unknown, entityLabel?: string): DataError {
  if (error instanceof Error) {
    const pgError = error as { code?: string; message: string };

    if (pgError.code === "23505") {
      return {
        type: DataErrorType.VALIDATION,
        message: entityLabel ? `該${entityLabel}資料已存在` : "資料已存在",
        details: error,
      };
    }

    if (pgError.code === "23503") {
      return {
        type: DataErrorType.VALIDATION,
        message: "參照的資料不存在",
        details: error,
      };
    }

    return {
      type: DataErrorType.DATABASE,
      message: pgError.message,
      details: error,
    };
  }

  return {
    type: DataErrorType.UNKNOWN,
    message: "未知錯誤",
    details: error,
  };
}

/**
 * Apply filters, sorting, and pagination to a Supabase query
 */
export function applyQueryOptions(
  query: ReturnType<ReturnType<typeof supabase.from>["select"]>,
  options?: QueryOptions,
  defaultSort?: SortField | SortField[],
) {
  let q = query;

  if (options?.filters) {
    for (const filter of options.filters) {
      switch (filter.operator) {
        case "eq":
          q = q.eq(filter.field, filter.value);
          break;
        case "neq":
          q = q.neq(filter.field, filter.value);
          break;
        case "gt":
          q = q.gt(filter.field, filter.value);
          break;
        case "gte":
          q = q.gte(filter.field, filter.value);
          break;
        case "lt":
          q = q.lt(filter.field, filter.value);
          break;
        case "lte":
          q = q.lte(filter.field, filter.value);
          break;
        case "like":
          q = q.ilike(filter.field, `%${filter.value}%`);
          break;
        case "in":
          q = q.in(filter.field, filter.value as unknown[]);
          break;
      }
    }
  }

  if (options?.sort) {
    q = q.order(options.sort.field, { ascending: options.sort.ascending });
  } else if (defaultSort) {
    const sorts = Array.isArray(defaultSort) ? defaultSort : [defaultSort];
    for (const s of sorts) {
      q = q.order(s.field, { ascending: s.ascending });
    }
  }

  if (options?.pagination) {
    q = q.range(
      options.pagination.offset,
      options.pagination.offset + options.pagination.limit - 1,
    );
  }

  return q;
}

type SortField = { field: string; ascending: boolean };

interface CrudConfig {
  tableName: string;
  entityLabel: string;
  defaultSort?: SortField | SortField[];
  selectClause?: string;
}

/**
 * Create standard CRUD operations for a Supabase table.
 *
 * Usage:
 *   const { getAll, getById, create, update, remove } = createCrud<Student>({
 *     tableName: "wg_students",
 *     entityLabel: "學生",
 *     defaultSort: { field: "name", ascending: true },
 *   });
 */
export function createCrud<T extends { id: string }>(config: CrudConfig) {
  const { tableName, entityLabel, defaultSort, selectClause = "*" } = config;

  async function getAll(options?: QueryOptions): Promise<ListResult<T>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const query = (supabase.from(tableName) as any).select(selectClause, {
        count: "exact",
      });
      const result = await applyQueryOptions(query, options, defaultSort);
      const { data, error, count } = result;

      if (error) {
        return { data: [], error: toDataError(error, entityLabel), count: 0 };
      }
      return {
        data: (data as T[]) ?? [],
        error: null,
        count: count ?? undefined,
      };
    } catch (error) {
      return { data: [], error: toDataError(error, entityLabel), count: 0 };
    }
  }

  async function getById(id: string): Promise<DataResult<T>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from(tableName) as any)
        .select(selectClause)
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return {
            data: null,
            error: {
              type: DataErrorType.NOT_FOUND,
              message: `找不到該${entityLabel}`,
              details: error,
            },
          };
        }
        return { data: null, error: toDataError(error, entityLabel) };
      }
      return { data: data as T, error: null };
    } catch (error) {
      return { data: null, error: toDataError(error, entityLabel) };
    }
  }

  async function create(input: CreateInput<T>): Promise<DataResult<T>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from(tableName) as any)
        .insert(input)
        .select(selectClause)
        .single();

      if (error) {
        return { data: null, error: toDataError(error, entityLabel) };
      }
      return { data: data as T, error: null };
    } catch (error) {
      return { data: null, error: toDataError(error, entityLabel) };
    }
  }

  async function update(
    id: string,
    updates: UpdateInput<T>,
  ): Promise<DataResult<T>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from(tableName) as any)
        .update(updates)
        .eq("id", id)
        .select(selectClause)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return {
            data: null,
            error: {
              type: DataErrorType.NOT_FOUND,
              message: `找不到該${entityLabel}`,
              details: error,
            },
          };
        }
        return { data: null, error: toDataError(error, entityLabel) };
      }
      return { data: data as T, error: null };
    } catch (error) {
      return { data: null, error: toDataError(error, entityLabel) };
    }
  }

  async function remove(id: string): Promise<DataResult<T>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from(tableName) as any)
        .delete()
        .eq("id", id)
        .select(selectClause)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return {
            data: null,
            error: {
              type: DataErrorType.NOT_FOUND,
              message: `找不到該${entityLabel}`,
              details: error,
            },
          };
        }
        return { data: null, error: toDataError(error, entityLabel) };
      }
      return { data: data as T, error: null };
    } catch (error) {
      return { data: null, error: toDataError(error, entityLabel) };
    }
  }

  return { getAll, getById, create, update, remove };
}
