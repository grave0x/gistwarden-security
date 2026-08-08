import { assertEquals, assert } from "./assert.ts";
import {
  asVaultItemId,
  matchGoogleMigrationAccounts,
  parseGoogleMigrationUri,
  VaultItemType,
} from "@gistwarden/domain";
import type { LoginVaultItem } from "@gistwarden/domain";

const test1 = () => {
  const uri1 =
    "otpauth-migration://offline?data=CiUKFElOUzA3NjBTN1FXWVRINkFLVFFLEgdJTlMwNzYwIAEoATACEAIYASAA";
  const res1 = parseGoogleMigrationUri(uri1);

  assert(res1.isOk(), "Expected res1 to be OK");
  const payload1 = res1.value;

  assertEquals(payload1.accounts.length, 1);
  assert(payload1.accounts[0]);
  assertEquals(payload1.accounts[0].name, "INS0760");
  assertEquals(payload1.accounts[0].secretBase32, "JFHFGMBXGYYFGN2RK5MVISBWIFFVIUKL");
  assertEquals(payload1.accounts[0].algorithm, "SHA1");
  assertEquals(payload1.accounts[0].digits, 6);
};

const test2 = () => {
  const uri2 =
    "otpauth-migration://offline?data=Cj4KEDDrPNWDl3xN6gJ/f6oAKiISF2xpbmguZHR0QGluc21hcnQuY29tLnZuGgtTb3Bob3MgU0ZPUyABKAEwAgolChRJTlMwNzYwUzdRV1lUSDZBS1RRSxIHSU5TMDc2MCABKAEwAhACGAEgAA%3D%3D";
  const res2 = parseGoogleMigrationUri(uri2);

  assert(res2.isOk(), "Expected res2 to be OK");
  const payload2 = res2.value;

  assertEquals(payload2.accounts.length, 2);
  assert(payload2.accounts[0]);
  assert(payload2.accounts[1]);

  assertEquals(payload2.accounts[0].name, "linh.dtt@insmart.com.vn");
  assertEquals(payload2.accounts[0].issuer, "Sophos SFOS");
  assertEquals(payload2.accounts[0].secretBase32, "GDVTZVMDS56E32QCP572UABKEI");

  assertEquals(payload2.accounts[1].name, "INS0760");
  assertEquals(payload2.accounts[1].secretBase32, "JFHFGMBXGYYFGN2RK5MVISBWIFFVIUKL");
};

const test3 = () => {
  const invalidRes = parseGoogleMigrationUri("invalid-data-string");
  assert(invalidRes.isErr(), "Expected invalid string to return Error");
};

const test4 = () => {
  const uri =
    "otpauth-migration://offline?data=Cj4KEDDrPNWDl3xN6gJ/f6oAKiISF2xpbmguZHR0QGluc21hcnQuY29tLnZuGgtTb3Bob3MgU0ZPUyABKAEwAgolChRJTlMwNzYwUzdRV1lUSDZBS1RRSxIHSU5TMDc2MCABKAEwAhACGAEgAA%3D%3D";
  const payload = parseGoogleMigrationUri(uri)._unsafeUnwrap();

  const existingVaultItems: LoginVaultItem[] = [
    {
      id: asVaultItemId("vault-item-1"),
      type: VaultItemType.Login,
      name: "Sophos SFOS Portal",
      login: {
        username: "linh.dtt@insmart.com.vn",
      },
      notes: "",
      favorite: false,
      reprompt: 0,
      fields: [],
      creationDate: "",
      revisionDate: "",
    },
  ];

  const mappings = matchGoogleMigrationAccounts(
    payload.accounts,
    existingVaultItems,
  );

  assertEquals(mappings.length, 2);
  assert(mappings[0]);
  assert(mappings[1]);
  assertEquals(mappings[0].action, "skip");
  assertEquals(mappings[0].targetItemId, "vault-item-1");

  assertEquals(mappings[1].action, "skip");
  assertEquals(mappings[1].targetItemId, null);
};

console.log("Running Google Migration Tests...");
test1();
test2();
test3();
test4();
console.log("All Google Migration Tests Passed Successfully!");
