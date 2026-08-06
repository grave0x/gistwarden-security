# Architectural Design Patterns in Gistwarden

A comprehensive guide to the production software design patterns implemented across the Gistwarden password manager codebase, optimized for modern TypeScript (2026 Edition) and Web Extension Manifest V3 architecture.

---

## 1. Creational Design Patterns

### 1.1. Factory Functions with Mapped Types

#### Overview
Rather than instantiating domain entities via subclass hierarchies or complex `new` constructors across client code, Gistwarden uses pure **Factory Functions** paired with TypeScript **Mapped Types**. This isolates instantiation logic and guarantees complete type safety for all 5 Vault item types (`login`, `card`, `identity`, `secure_note`, `ssh_key`).

#### Implementation
```typescript
import { VaultItem, LoginItem, CardItem, SshKeyItem } from "@gistwarden/domain";

export interface VaultItemCreationMap {
  login: { username: string; password?: string; uris?: string[] };
  card: { cardholderName: string; number: string; expMonth: string; expYear: string };
  ssh_key: { privateKey: string; publicKey?: string; passphrase?: string };
}

export function createVaultItem<K extends keyof VaultItemCreationMap>(
  type: K,
  name: string,
  params: VaultItemCreationMap[K]
): VaultItem {
  const base = {
    id: crypto.randomUUID(),
    name,
    revisionDate: Date.now(),
    deletedDate: null,
  };

  switch (type) {
    case "login": {
      const p = params as VaultItemCreationMap["login"];
      return {
        ...base,
        type: "login",
        login: { username: p.username, password: p.password ?? "", uris: p.uris ?? [] },
      };
    }
    case "card": {
      const p = params as VaultItemCreationMap["card"];
      return {
        ...base,
        type: "card",
        card: { cardholderName: p.cardholderName, number: p.number, expMonth: p.expMonth, expYear: p.expYear },
      };
    }
    case "ssh_key": {
      const p = params as VaultItemCreationMap["ssh_key"];
      return {
        ...base,
        type: "ssh_key",
        sshKey: { privateKey: p.privateKey, publicKey: p.publicKey ?? "", passphrase: p.passphrase ?? "" },
      };
    }
    default:
      throw new Error(`Unsupported vault item type: ${type}`);
  }
}
```

#### Key Benefits
- **Loose Coupling**: Calling components remain completely ignorant of internal payload structures.
- **Strict Parameter Safety**: TypeScript validates parameter shapes per item type via `VaultItemCreationMap[K]`.

---

### 1.2. Configuration Objects (Modern Alternative to Builder Class)

#### Overview
Traditional Class Builders require boilerplate methods (`setX().setY().build()`). In Gistwarden, configuration objects with optional properties and object destructuring replace Builder classes, producing cleaner, less bloated TypeScript code.

#### Implementation
```typescript
export interface PasswordGeneratorOptions {
  readonly length: number;
  readonly useUppercase?: boolean;
  readonly useLowercase?: boolean;
  readonly useNumbers?: boolean;
  readonly useSpecial?: boolean;
  readonly minNumbers?: number;
  readonly minSpecial?: number;
}

export function generatePassword(options: PasswordGeneratorOptions): string {
  const {
    length,
    useUppercase = true,
    useLowercase = true,
    useNumbers = true,
    useSpecial = false,
    minNumbers = 1,
    minSpecial = 1,
  } = options;

  // Generation logic using validated options
  return buildRandomString({ length, useUppercase, useLowercase, useNumbers, useSpecial, minNumbers, minSpecial });
}
```

#### Key Benefits
- **Zero Boilerplate**: Eliminates hundreds of lines of Builder class setter boilerplate.
- **Explicit & Self-Documenting**: Call sites specify named parameters clearly without telescoping arguments.

---

### 1.3. Prototype Pattern via Native `structuredClone`

#### Overview
Cloning complex, nested domain objects (such as Vault items or account states during synchronization merges) requires deep cloning to prevent shared reference mutation. Gistwarden utilizes the ECMAScript native `structuredClone` API instead of external libraries like `lodash.cloneDeep`.

#### Implementation
```typescript
export function cloneVaultCollection<T>(collection: readonly T[]): T[] {
  return structuredClone(collection);
}

// Deep clone in state update:
export function updateVaultState(currentState: VaultState, itemUpdate: VaultItem): VaultState {
  const clonedState = structuredClone(currentState);
  const index = clonedState.items.findIndex((i) => i.id === itemUpdate.id);
  if (index !== -1) {
    clonedState.items[index] = itemUpdate;
  }
  return clonedState;
}
```

#### Key Benefits
- **Shared Memory Safety**: Completely isolates cloned state from original references.
- **Zero Bundle Overhead**: Native browser/runtime API with high execution speed.

---

### 1.4. ES Module Scope Singletons

#### Overview
Java/C++ style singletons (`private constructor` + `getInstance()`) add unnecessary friction in JavaScript/TypeScript. Gistwarden leverages **ES Module Scope**, which guarantees that exported instances are evaluated once and cached globally across all imports.

#### Implementation
```typescript
// packages/repository/src/storage.ts
class ChromeExtensionStorageRepository {
  async get<T>(key: string): Promise<T | null> {
    const data = await chrome.storage.local.get(key);
    return (data[key] as T) ?? null;
  }
}

// Instantiate and export single shared instance
export const storageRepository = new ChromeExtensionStorageRepository();
```

---

## 2. Structural Design Patterns

### 2.1. Adapter Pattern (Decoupled Sync Providers)

#### Overview
The Adapter pattern translates third-party API contracts into a standard interface required by Gistwarden. `GithubGistProvider` implements `ISyncProvider`, allowing the core application to swap backend providers (e.g. GitHub Gist, WebDAV, Self-Hosted API) without modifying business logic.

#### Implementation
```typescript
// packages/network/src/sync-provider-types.ts
export interface SyncOptions {
  readonly token?: string;
  readonly gistId?: string;
  readonly username?: string;
}

export interface SyncResult {
  readonly content?: string;
  readonly gistId?: string;
}

export interface ISyncProvider {
  readonly id: string;
  readonly name: string;
  upload(content: string, options?: SyncOptions): Promise<Result<SyncResult, TranslationKey>>;
  download(options?: SyncOptions): Promise<Result<SyncResult, TranslationKey>>;
  delete(targetId?: string, options?: SyncOptions): Promise<Result<void, TranslationKey>>;
}

// packages/network/src/github-gist-provider.ts
export class GithubGistProvider implements ISyncProvider {
  readonly id = "github_gist";
  readonly name = "GitHub Gist";

  async upload(content: string, options?: SyncOptions): Promise<Result<SyncResult, TranslationKey>> {
    return await uploadToGist(content, options);
  }

  async download(options?: SyncOptions): Promise<Result<SyncResult, TranslationKey>> {
    return await downloadFromGist(options);
  }

  async delete(targetId?: string, options?: SyncOptions): Promise<Result<void, TranslationKey>> {
    return await deleteGist(targetId || "", options?.token);
  }
}
```

#### Key Benefits
- **Provider Independence**: Business logic depends strictly on `ISyncProvider`.
- **Unit Testability**: Mocks can be passed seamlessly without touching local storage or network calls.

---

### 2.2. Facade Pattern (Use-Case Orchestrators)

#### Overview
Gistwarden uses the Facade pattern across its Use-Case Orchestrator layer (`packages/orchestrator`). The orchestrator presents simplified, high-level functions to the UI and extension background handlers, hiding low-level interactions between Storage Repositories, Domain Managers, and Network Clients.

#### Implementation
```typescript
// UI and Message Router only call this simplified facade
export async function uploadToGistUseCase(payload: UploadToGistMsg): Promise<SyncActionResponse> {
  const token = await getGithubToken();
  if (!token) return { success: false, error: "github_error_missing_token" };

  const settingsRes = await getAccountSettings();
  if (settingsRes.isErr()) return { success: false, error: settingsRes.error };

  const githubConfig = settingsRes.value.githubConfig;
  const res = await getSyncProvider().upload(payload.content || "", {
    token,
    gistId: githubConfig.gistId,
    username: githubConfig.username,
  });

  if (res.isOk()) {
    const gistId = res.value.gistId;
    if (gistId && gistId !== githubConfig.gistId) {
      await updateAccountSettings({
        githubConfig: { ...githubConfig, gistId },
        lastSync: Date.now(),
      });
    } else {
      await updateAccountSettings({ lastSync: Date.now() });
    }
    return { success: true };
  }
  return { success: false, error: res.error };
}
```

---

### 2.3. Proxy Pattern (ES6 Proxy for Message Router & Security Guards)

#### Overview
ES6 `Proxy` wraps target handlers to enforce security authorization, audit logging, and payload validation dynamically before execution.

#### Implementation
```typescript
export function createAuthorizedRouterProxy<T extends object>(targetRouter: T, senderOrigin: string): T {
  return new Proxy(targetRouter, {
    get(target, prop, receiver) {
      const originalMethod = Reflect.get(target, prop, receiver);
      if (typeof originalMethod === "function") {
        return async function (...args: unknown[]) {
          // Security Guard: Check sender authorization
          if (senderOrigin.includes("untrusted-domain.com")) {
            console.warn(`[Proxy Guard] Blocked request from ${senderOrigin}`);
            return { success: false, error: "unauthorized" };
          }
          return await originalMethod.apply(target, args);
        };
      }
      return originalMethod;
    },
  });
}
```

---

## 3. Behavioral & Modern Architectural Patterns

### 3.1. Chain of Responsibility (Extension Middleware Pipeline)

#### Overview
Incoming extension messages pass through a pipeline of handlers (Authentication -> Schema Validation -> Handler Execution). Each step either processes the message or terminates the pipeline early upon failure.

#### Implementation
```typescript
type MessageMiddleware = (msg: ExtensionMessage, next: () => Promise<unknown>) => Promise<unknown>;

export class ExtensionMessagePipeline {
  private middlewares: MessageMiddleware[] = [];

  use(middleware: MessageMiddleware): void {
    this.middlewares.push(middleware);
  }

  async execute(msg: ExtensionMessage): Promise<unknown> {
    let index = 0;
    const next = async (): Promise<unknown> => {
      if (index < this.middlewares.length) {
        const middleware = this.middlewares[index++];
        return await middleware(msg, next);
      }
      return { success: false, error: "handler_not_found" };
    };
    return await next();
  }
}
```

---

### 3.2. Monadic Error Handling (`Result<T, E>`)

#### Overview
Instead of throwing uncaught exceptions, all operations return a `Result<T, E>` union (`ok(value)` / `err(error)`). Callers are forced by the type system to check success before accessing data.

#### Implementation
```typescript
import { ok, err, Result } from "@gistwarden/domain";

export function parseSshKey(rawKey: string): Result<SshKeyDetails, "invalid_ssh_key"> {
  if (!rawKey.startsWith("-----BEGIN OPENSSH PRIVATE KEY-----")) {
    return err("invalid_ssh_key");
  }
  // Parsing logic
  return ok({ type: "rsa", bits: 4096 });
}

// Caller Usage:
const keyResult = parseSshKey(input);
if (keyResult.isErr()) {
  console.error("Failed to parse:", keyResult.error); // Early return on failure
  return;
}
console.log(keyResult.value.type); // Type-safe access
```

---

### 3.3. Discriminated Unions with Exhaustive Checks (`assertNever`)

#### Overview
Gistwarden uses tagged unions with an `assertNever` helper in `switch` statements. If a developer adds a new union variant without updating all matching `switch` cases, TypeScript emits a compile-time error.

#### Implementation
```typescript
export function assertNever(x: never): never {
  throw new Error(`Unhandled union variant: ${JSON.stringify(x)}`);
}

export function formatVaultItemHeader(item: VaultItem): string {
  switch (item.type) {
    case "login":
      return `Login (${item.login.username})`;
    case "card":
      return `Card (Ending in ${item.card.number.slice(-4)})`;
    case "identity":
      return `Identity (${item.name})`;
    case "secure_note":
      return `Note (${item.name})`;
    case "ssh_key":
      return `SSH Key (${item.name})`;
    default:
      return assertNever(item); // Compile error if new type is added without updating this function
  }
}
```

---

## 4. Design Pattern Evaluation Matrix

| Pattern | Category | Gistwarden Status | Implementation Approach |
| :--- | :--- | :--- | :--- |
| **Factory Method** | Creational | **Adopted** | Factory Functions + Mapped Types |
| **Builder** | Creational | **Replaced** | Configuration Objects + Destructuring |
| **Prototype** | Creational | **Adopted** | ECMAScript `structuredClone` Native API |
| **Singleton** | Creational | **Adopted** | ES Module Scope Exports |
| **Adapter** | Structural | **Adopted** | `ISyncProvider` Interface & Provider Implementations |
| **Facade** | Structural | **Adopted** | Use-Case Orchestrators (`packages/orchestrator`) |
| **Proxy** | Structural | **Adopted** | ES6 `Proxy` for Router Authorization |
| **Chain of Responsibility** | Behavioral | **Adopted** | Extension Message Middleware Pipeline |
| **Monadic Error Handling** | Architecture | **Adopted** | `Result<T, E>` Discriminated Union Returns |
| **Abstract Factory** | Creational | *Omitted* | Replaced by Component Composition & Config Maps |
| **Flyweight** | Structural | *Omitted* | Replaced by Simple `Map` Cache & Object Literals |
