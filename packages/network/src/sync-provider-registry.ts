import { GithubGistProvider } from "./github-gist-provider.ts";
import { LocalStorageProvider } from "./local-storage-provider.ts";
import { SelfHostedProvider } from "./self-hosted-provider.ts";
import type { ISyncProvider, SyncProviderId } from "./sync-provider-types.ts";

const registry = new Map<SyncProviderId, ISyncProvider>();

// Register default providers
const defaultGistProvider = new GithubGistProvider();
const defaultLocalStorageProvider = new LocalStorageProvider();
const defaultSelfHostedProvider = new SelfHostedProvider();
registry.set(defaultGistProvider.id, defaultGistProvider);
registry.set(defaultLocalStorageProvider.id, defaultLocalStorageProvider);
registry.set(defaultSelfHostedProvider.id, defaultSelfHostedProvider);

export function registerSyncProvider(provider: ISyncProvider): void {
  registry.set(provider.id, provider);
}

export function getSyncProvider(
  providerId: SyncProviderId = "github_gist",
): ISyncProvider {
  return registry.get(providerId) ?? defaultGistProvider;
}
