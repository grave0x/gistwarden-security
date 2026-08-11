import { test } from "./assert.ts";
import { runMasterVaultE2EFlow } from "./test-helpers.ts";

test("Vault Auth & Data Flow - Local Storage Mode (Register -> Folders -> 5-Type CRUD -> PIN Wipe -> Change MP -> Logout -> Relogin -> Delete Vault)", async () => {
  await runMasterVaultE2EFlow("local_storage");
}, 30000);

test("Vault Auth & Data Flow - Cloud Gist Mode (Register -> Folders -> 5-Type CRUD -> PIN Wipe -> Change MP -> Logout -> Relogin -> Delete Vault)", async () => {
  await runMasterVaultE2EFlow("github_gist");
}, 30000);
