export type ID = string;

export type Timestamp = string;

export type Nullable<T> = T | null;

export type Paginated<T> = {
  data: T[];
  count: number;
};