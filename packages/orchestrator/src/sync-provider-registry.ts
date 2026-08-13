import type { ISyncProvider, SyncProviderId } from "@gistwarden/domain";
import { GithubGistProvider, SelfHostedProvider } from "@gistwarden/network";
import { LocalStorageProvider } from "@gistwarden/repository";

const registry = new Map<SyncProviderId, ISyncProvider>();

// Register default providers across Network & Repository
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
