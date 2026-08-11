import { GithubGistProvider } from "./github-gist-provider.ts";
import { LocalStorageProvider } from "./local-storage-provider.ts";
import type { ISyncProvider, SyncProviderId } from "./sync-provider-types.ts";

const registry = new Map<SyncProviderId, ISyncProvider>();

// Register default providers
const defaultGistProvider = new GithubGistProvider();
const defaultLocalStorageProvider = new LocalStorageProvider();
registry.set(defaultGistProvider.id, defaultGistProvider);
registry.set(defaultLocalStorageProvider.id, defaultLocalStorageProvider);

export function registerSyncProvider(provider: ISyncProvider): void {
  registry.set(provider.id, provider);
}

export function getSyncProvider(
  providerId: SyncProviderId = "github_gist",
): ISyncProvider {
  return registry.get(providerId) ?? defaultGistProvider;
}
