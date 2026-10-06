export type EntityId = string;
export type DeepReadonly<T> =
  T extends string | number | boolean | null ? T :
  T extends readonly (infer U)[] ? readonly DeepReadonly<U>[] :
  { readonly [K in keyof T]: DeepReadonly<T[K]> };
export type Validation<T> =
  | { ok: true; value: T }
  | { ok: false; message: string; field?: string };
export type Snapshot<S> = DeepReadonly<{
  id: string;
  ordinal: number;
  state: S;
  event: {
    type: string;
    affectedIds: readonly EntityId[];
    operands: readonly (string | number)[];
    codeLineId: string | null;
    explanationKey: string;
  };
  variables: Readonly<Record<string, string | number | boolean | null>>;
  counters: Readonly<Record<string, number>>;
  invariants: readonly { id: string; status: 'holds' | 'repairing' }[];
}>;
export type Inspection = {
  id: EntityId;
  label: string;
  fields: readonly { label: string; value: string }[];
};
export type LessonEngine<I,C,S> = {
  id: string;
  version: string;
  commandStart: 'run-boundary' | 'any-step';
  validateInput(raw: unknown): Validation<I>;
  validateCommand(raw: unknown, input: I): Validation<C>;
  createInitialSnapshot(input: I): Snapshot<S>;
  createTrace(input: I, command: C): readonly Snapshot<S>[];
  inspect(snapshot: Snapshot<S>, id: EntityId): Inspection | null;
};
export type SceneAdapterProps<S> = {
  snapshot: Snapshot<S>;
  selectedIds: readonly EntityId[];
  select(id: EntityId): void;
  reducedMotion: boolean;
};

export function deepFreeze<T>(value: T): DeepReadonly<T> {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value as DeepReadonly<T>;
}
