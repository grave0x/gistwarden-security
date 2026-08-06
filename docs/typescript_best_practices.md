# Expert TypeScript Engineering Guidelines & Best Practices

A curated, concise reference of production-grade TypeScript rules and
principles, distilled from the TypeScript Handbook, the TypeScript API
Guidelines community consensus, and current (2026) production patterns from
strict-mode-first codebases.

---

## 1. Type System & Domain Modeling

- **Enable Maximum Strictness from Day One:**
  - Turn on `strict: true` plus `noUncheckedIndexedAccess`,
    `exactOptionalPropertyTypes`, and `noImplicitOverride` in `tsconfig.json`.
    Retrofitting strictness onto a loose codebase is far more expensive than
    starting strict.
- **Discriminated Unions over Optional-Field Bags:**
  - Model state machines and API responses as discriminated unions
    (`{ status: 'loading' } | { status: 'success'; data: T } | { status: 'error'; error: string }`)
    instead of interfaces with many optional fields — this lets the compiler
    narrow the type per-branch and eliminates whole classes of "is this field
    present" bugs.
- **Branded (Nominal) Types for Domain Identifiers:**
  - Wrap primitive IDs (`UserId`, `OrderId`) in branded types
    (`type UserId = string & { readonly __brand: 'UserId' }`) to prevent
    accidentally passing a `ProductId` where a `UserId` is expected —
    TypeScript's structural typing otherwise treats both as plain `string`.
- **`satisfies` over Type Annotations for Config-Like Objects:**
  - Use the `satisfies` operator (TS 4.9+) to validate an object against a type
    without widening its literal types, preserving precise inference (e.g.
    `as const`-like literal narrowing) while still checking shape correctness.
- **`interface` for Extendable Object Shapes, `type` for Unions/Mapped Types:**
  - Use `interface` for public object shapes that may be extended or
    declaration-merged; use `type` for unions, intersections, tuples, and
    mapped/conditional types. Be consistent within a repo rather than dogmatic.
- **Exhaustiveness Checking with `never`:**
  - In `switch` statements over a discriminated union, add a `default` branch
    that assigns the remaining value to a variable typed `never` — this makes
    the compiler flag any unhandled case the moment a new union member is added.
- **Avoid `any`; Prefer `unknown` at Untyped Boundaries:**
  - `any` disables type checking entirely and silently propagates. Use `unknown`
    for values of genuinely unknown shape (network responses, `JSON.parse`
    output, `catch` bindings) and narrow it explicitly before use.

---

## 2. Immutability & Data Flow

- **`readonly` and `as const` by Default:**
  - Mark object/array properties `readonly` and use `as const` for literal
    configuration objects and tuples, so accidental mutation is a compile-time
    error rather than a runtime surprise.
- **Prefer Functional Updates over In-Place Mutation:**
  - Build new objects/arrays (`{ ...state, field: next }`,
    `array.map(...)`/`.filter(...)`) instead of mutating shared state in place,
    especially in state-management and React/Vue reducers where reference
    equality drives re-renders.
- **`structuredClone` over `JSON.parse(JSON.stringify(...))`:**
  - Use the built-in `structuredClone` for deep-cloning plain data — the JSON
    round-trip idiom silently drops `Date`, `Map`, `Set`, `undefined`, and
    function values.

---

## 3. Idiomatic Error Handling

- **Typed `catch` Bindings:**
  - Treat `catch (err)` bindings as `unknown` (the TS default since 4.4) and
    narrow with `instanceof Error` before accessing `.message`/`.stack` — never
    assume the thrown value is an `Error`.
- **Custom Error Subclasses for Domain Failures:**
  - Define specific `Error` subclasses (`class NotFoundError extends Error`) for
    expected domain failure modes instead of throwing plain strings or generic
    `Error`, so callers can `instanceof`-discriminate.
- **`Result`-Style Returns for Expected, Recoverable Failures:**
  - For failures that are a normal part of a function's contract (validation
    failure, "not found"), consider returning a discriminated-union
    `Result<T, E>` type rather than throwing — this makes the failure path
    visible in the function's signature instead of hidden in control flow.
    Reserve `throw` for truly exceptional, unrecoverable conditions.
- **Never Silently Swallow Errors:**
  - Avoid empty `catch {}` blocks or catching only to `console.log` and
    continue; either handle the error meaningfully, rethrow, or attach context
    and propagate.

---

## 4. Architecture & Layer Boundaries

- **Isolate Domain Logic from I/O:**
  - Keep pure business logic (calculations, validation, state transitions) free
    of direct dependencies on HTTP clients, databases, or the DOM/file system.
    I/O-touching code should call into the domain layer, not the reverse.
- **Feature-Based, Not Type-Based, Folder Structure at Scale:**
  - For large applications, prefer grouping by feature/domain
    (`features/users/`, `features/orders/`) over grouping purely by technical
    kind (`controllers/`, `services/`, `types/`) — it keeps related code (and
    its types) colocated and reduces cross-cutting circular imports.
- **Dedicated Types for API Responses, DTOs, and Domain Entities:**
  - Keep the shape a database/API returns separate from the shape your domain
    logic consumes; map explicitly at the boundary rather than letting a
    persistence or wire-format type leak through the whole codebase.

---

## 5. Tooling & Quality Assurance

- **Consolidated Lint/Format Toolchain:**
  - The 2026 default is `typescript-eslint` (flat config) for teams needing
    specific ESLint plugins, or **Biome** (a single Rust-based binary that
    replaces ESLint + Prettier, with type-aware lint rules as of Biome v2) for
    teams that want one fast, zero-config-conflict tool. Pick one and enforce it
    in CI and pre-commit hooks.
- **Type-Aware Linting:**
  - Enable type-aware lint rules (`no-floating-promises`, `no-unsafe-*`,
    `no-misused-promises`) — these catch bug classes plain syntactic linting
    cannot, such as an un-awaited `Promise` or an unsafe `any` flowing into a
    typed API.
- **CI Gate on `tsc --noEmit`:**
  - Run a dedicated type-check step (`tsc --noEmit`) in CI independent of the
    bundler/test runner's own (often looser) type stripping, so type errors can
    never merge silently.

---

## 6. Runtime Boundary Validation

- **Parse, Don't Assert, at Untyped Boundaries:**
  - TypeScript types are erased at runtime and only describe what _should_ be
    true — they do not validate what actually arrives. At every boundary where
    data crosses from the outside world (API responses, route params, env vars,
    form input, `JSON.parse` output), parse it with a schema library (`zod`,
    `valibot`, or `arktype`) and derive the static type from the schema, instead
    of using a bare `as` type assertion.
- **Avoid `as` as a Substitute for Validation:**
  - `as` tells the compiler to trust you; it performs no runtime check. Use it
    only for narrowing cases you have already validated by other means (e.g.
    after a schema `.parse()` call), never as a shortcut past an untyped
    boundary.
- **Single Source of Truth: Schema-Derived Types:**
  - Where a schema library is in use, derive the TypeScript type from the schema
    (`type User = z.infer<typeof UserSchema>`) rather than maintaining a
    hand-written interface and a schema in parallel, which drift apart over
    time.

---

## 7. Security & Sensitive Data Handling

- **Never Use `eval`, `new Function`, or Dynamic `require`/`import` on Untrusted
  Input:**
  - These execute arbitrary code and are a direct code-injection vector.
- **Constant-Time Comparison for Secrets:**
  - Compare secret tokens, API keys, and HMAC signatures with a constant-time
    primitive (`crypto.timingSafeEqual` in Node) rather than `===`, to avoid
    timing side-channel leaks — the same rationale as constant-time comparison
    in any other language.
- **Guard against Prototype Pollution:**
  - Avoid deep-merging or recursively assigning untrusted object keys
    (`__proto__`, `constructor`, `prototype`) without an allowlist; prefer
    well-audited merge utilities that explicitly guard against this.
- **Dependency Vulnerability Scanning:**
  - Run `npm audit` (or an equivalent like Socket) in CI, and keep dependencies
    patched via automated tooling (Renovate/Dependabot) rather than ad-hoc
    manual updates.

---

## 8. Collections & Performance

- **`Map`/`Set` over Plain Objects for Dynamic Keys:**
  - Use `Map`/`Set` when keys are added/removed dynamically or aren't known
    string literals — they avoid prototype-chain lookup surprises and have
    predictable iteration order and `O(1)` `has`/`delete`.
- **Avoid Unnecessary Array Copies in Hot Paths:**
  - Chaining multiple `.map().filter().map()` calls over large arrays creates an
    intermediate array per step; for hot paths, prefer a single `.reduce()` or
    an explicit loop, and pre-size arrays with `new Array(n)` when the final
    length is known.
- **Memoize Expensive Pure Computations:**
  - Cache the result of expensive, pure functions (`useMemo` in React, or a
    manual `Map`-based cache) keyed on their inputs, rather than recomputing on
    every call/render.

---

## 9. Utility Types & Ergonomic APIs

- **Prefer Built-In Utility Types before Rolling Your Own:**
  - Reach for `Partial`, `Required`, `Pick`, `Omit`, `Record`, `Readonly`, and
    `ReturnType`/`Parameters` before writing a custom mapped/conditional type
    that duplicates one of them.
- **Generic Constraints for Better Inference:**
  - Constrain generic parameters (`<T extends Record<string, unknown>>`) rather
    than leaving them unconstrained or falling back to broad types — this both
    documents intent and improves the compiler's inference at call sites.
- **Function Overloads for Genuinely Different Call Shapes:**
  - When a function's return type depends on which arguments were passed in a
    way a single generic signature can't express cleanly, use function overload
    signatures rather than a single loosely-typed signature with internal `if`
    branching on argument shape.

---

## 10. Asynchronous Programming & Concurrency

- **No Floating Promises:**
  - Every `Promise` should be `await`-ed, returned, or explicitly marked as
    intentionally unhandled (`void somePromise()`); an unawaited promise
    silently swallows its rejection. Enforce this with the
    `no-floating-promises` lint rule.
- **`Promise.all` vs `Promise.allSettled`:**
  - Use `Promise.all` when any single failure should abort the whole batch; use
    `Promise.allSettled` when partial success is meaningful and you need every
    result (success or failure) regardless of individual rejections.
- **`AbortController` for Cancellation:**
  - Thread an `AbortSignal` through fetch calls and long-running async work so
    callers can cancel in-flight operations (timeouts, component unmount,
    user-initiated cancel) instead of leaving them to run to completion
    unobserved.
- **Don't Block the Event Loop:**
  - Avoid synchronous, CPU-heavy work (large synchronous JSON parsing, tight
    computational loops) on the main thread of a server or UI process; offload
    it to a worker thread/Web Worker when it's unavoidable.

---

## 11. Testing & Verification

- **Vitest as the Default Test Runner:**
  - Vitest (or a runtime-native runner like Bun's) has become the standard for
    new TypeScript projects, largely replacing Jest, with faster startup and
    native ESM/TS support.
- **Type-Level Testing:**
  - For libraries with complex generic or conditional types, add type-level
    tests (`expect-type`, `tsd`, or `vitest`'s built-in `expectTypeOf`) that
    assert on the _inferred type_, not just runtime behavior — a function can
    behave correctly at runtime while its type signature silently regresses.
- **Test Behavior at Boundaries, Not Implementation Details:**
  - Mock/stub at architectural boundaries (network, database, filesystem) rather
    than mocking internal collaborators — this keeps tests resilient to internal
    refactors.

---

## 12. Dependency & Supply-Chain Management

- **Lockfile Discipline:**
  - Commit the lockfile (`package-lock.json`/`pnpm-lock.yaml`/`bun.lock`) and
    enforce CI installs with `--frozen-lockfile` (or equivalent) so a dependency
    can never silently drift between local and CI/production.
- **Automated Dependency Updates:**
  - Use Renovate or Dependabot to keep dependencies current in small, reviewable
    increments rather than large, risky manual bumps.
- **Correct `package.json` `exports` Field:**
  - For published packages, define the `exports` map explicitly (including
    `types` conditions) so consumers on different module systems (ESM/CJS) and
    TypeScript resolution modes get the correct entry point and type definitions
    — an incorrect or missing `exports` field is a common source of "types not
    found" issues for consumers.

---

## 13. Observability & Diagnostics

- **Structured Logging over `console.log`:**
  - Use a structured logger (e.g. `pino`) that emits JSON with levels and
    contextual fields in production services, instead of ad-hoc `console.log`
    calls that are hard to filter, correlate, or ship to a log aggregator.
- **Correlation/Request IDs across Async Boundaries:**
  - Propagate a request/trace ID through async call chains (e.g. via
    `AsyncLocalStorage` in Node) so logs and errors from a single logical
    operation can be correlated even when work spans multiple async hops.

---

## 14. Module & Project Organization

- **ESM-First:**
  - Default new projects to native ES Modules (`"type": "module"`) over
    CommonJS; the ecosystem (bundlers, runtimes, `exports` field resolution) has
    converged on ESM as the baseline.
- **Project References for Multi-Package Repos:**
  - In a monorepo, use TypeScript project references (`tsconfig` `references`
    - `composite: true`) so each package type-checks and builds incrementally
      against the declaration output of the others, instead of re-parsing the
      whole dependency graph on every build.
- **Modern Monorepo Orchestration:**
  - For multi-package repositories, a task runner with dependency-aware caching
    (Turborepo, Nx) avoids rebuilding/retesting packages whose inputs haven't
    changed — increasingly paired with faster package managers/ runtimes (Bun,
    pnpm) and consolidated lint/format tooling (Biome) to reduce the number of
    moving parts in CI.

---

## 15. Rust-Grade Safety & Reliability Patterns in TypeScript

To achieve Rust-like safety guarantees in TypeScript without sacrificing developer experience, enforce the following 5 core patterns with explicit **DO** and **DON'T** practices:

---

### A. Transparent Error Handling with `Result<T, E>`

- **DON'T**: Throw uncaught exceptions or swallow errors with empty `catch` blocks.
```typescript
// Anti-pattern: Throws exception that crashes caller if unhandled
function parseData(jsonStr: string): UserData {
  return JSON.parse(jsonStr); // Crashes at runtime on invalid JSON
}

// Anti-pattern: Swallowing error silently
function getUser(id: string): UserData | null {
  try {
    return fetchUserFromDb(id);
  } catch {
    return null; // Conflates "not found" with "db network crash"!
  }
}
```

- **DO**: Return explicit `Result<T, E>` and handle early returns.
```typescript
import { ok, err, Result } from "@gistwarden/domain";

// Safe: Forced error path contract in type signature
export function parseData(jsonStr: string): Result<UserData, "invalid_json"> {
  try {
    return ok(JSON.parse(jsonStr) as UserData);
  } catch {
    return err("invalid_json");
  }
}

// Caller handle pattern:
const res = parseData(rawInput);
if (res.isErr()) {
  return showNotification(res.error); // Early return on error
}
console.log(res.value.name); // Type-safe access after isErr check
```

---

### B. Discriminated Unions with Exhaustive Checks (`assertNever`)

- **DON'T**: Use bloated interfaces full of optional fields.
```typescript
// Anti-pattern: Loose interface with optional fields
interface VaultItem {
  id: string;
  type: string;
  username?: string;    // Only for login
  cardNumber?: string;  // Only for card
  notes?: string;       // Only for note
}
// Problem: Item can have type "login" but missing username at runtime!
```

- **DO**: Use Discriminated Unions + `assertNever` in `switch` statements.
```typescript
// Safe: Strict tagged union
type VaultItem = 
  | { type: "login"; username: string; password: string }
  | { type: "card"; cardNumber: string; expiry: string }
  | { type: "note"; notes: string };

function assertNever(x: never): never {
  throw new Error(`Unhandled union case: ${JSON.stringify(x)}`);
}

function getItemSummary(item: VaultItem): string {
  switch (item.type) {
    case "login": return `Login: ${item.username}`;
    case "card": return `Card: **** ${item.cardNumber.slice(-4)}`;
    case "note": return `Note: ${item.notes.slice(0, 20)}`;
    default: return assertNever(item); // Compile Error if new union type added without handling!
  }
}
```

---

### C. Boundary Parsing with Zod (Never Trust External Input)

- **DON'T**: Trust dynamic inputs or use type assertions (`as`).
```typescript
// Anti-pattern: Type assertion performs zero runtime checks
function handleApiResponse(rawJson: unknown) {
  const user = rawJson as UserPayload; // If rawJson is null or missing fields, crashes later!
  console.log(user.profile.email);
}
```

- **DO**: Parse `unknown` inputs with Zod schemas at system boundaries and use `.readonly()` to enforce runtime and static immutability.
```typescript
import { z } from "zod";

// Safe: Validated boundary schema with Zod .readonly() modifier
const UserPayloadSchema = z.object({
  id: z.string(),
  profile: z.object({
    email: z.string().email(),
  }),
  tags: z.array(z.string()).readonly(), // Infer type: readonly string[]
}).readonly(); // Infer type: Readonly<{ readonly id: string; ... }>

export type UserPayload = z.infer<typeof UserPayloadSchema>;

function handleApiResponse(rawJson: unknown): Result<UserPayload, "invalid_payload"> {
  const parsed = UserPayloadSchema.safeParse(rawJson);
  if (!parsed.success) {
    return err("invalid_payload");
  }
  // parsed.data.tags.push("new"); // Compile Error: Cannot mutate readonly array!
  return ok(parsed.data);
}
```

---

### D. Zero Implicit Nullability & Strict Type Narrowing

- **DON'T**: Use non-null assertion `!` or skip null checks.
```typescript
// Anti-pattern: Non-null assertion bypasses compiler safeguard
const activeAccount = findAccount(id)!; 
console.log(activeAccount.token); // Crashes if account not found!
```

- **DO**: Narrow types explicitly before accessing properties.
```typescript
// Safe: Explicit narrowing
const activeAccount = findAccount(id);
if (activeAccount == null) {
  return err("account_not_found");
}
console.log(activeAccount.token); // Guaranteed non-null by TypeScript
```

---

### E. Immutability by Default (`readonly`, `as const`, Zod `.readonly()`)

- **DON'T**: Mutate input parameters or array state directly.
```typescript
// Anti-pattern: Mutating shared state in place
function addTag(item: VaultItem, tag: string) {
  item.tags.push(tag); // Side-effect: mutates caller's object!
}
```

- **DO**: Enforce immutability using TS `readonly`, `Readonly<T>`, `as const`, and Zod `.readonly()`.
```typescript
// Safe (TypeScript): Readonly modifier & pure function returning fresh instance
function addTag(
  item: Readonly<VaultItem & { readonly tags: readonly string[] }>, 
  tag: string
) {
  return {
    ...item,
    tags: [...item.tags, tag], // Fresh array instance
  };
}

// Safe (Zod + TS): Schema automatically produces immutable types
const ConfigSchema = z.object({
  apiEndpoint: z.string().url(),
  timeoutMs: z.number().positive(),
}).readonly();

type Config = z.infer<typeof ConfigSchema>; 
// Infer type: Readonly<{ readonly apiEndpoint: string; readonly timeoutMs: number }>
```

---

## Key References

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript release notes](https://www.typescriptlang.org/docs/handbook/release-notes/overview.html)
  — `satisfies`, `unknown` catch bindings, `noUncheckedIndexedAccess`, etc.
- [typescript-eslint](https://typescript-eslint.io/) — type-aware lint rules
- [Biome](https://biomejs.dev/) — consolidated linter/formatter
- [Zod](https://zod.dev/) / [Valibot](https://valibot.dev/) /
  [ArkType](https://arktype.io/) — runtime schema validation
- [Vitest](https://vitest.dev/) — test runner
- [Node.js `crypto.timingSafeEqual`](https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b)
- [Turborepo](https://turborepo.com/) / [Nx](https://nx.dev/) — monorepo
  orchestration
