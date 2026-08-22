import { describe, expect, test } from "bun:test";
import {
  CustomFieldType,
  UriMatchMode,
  VaultItemBuilder,
  VaultItemType,
} from "@gistwarden/domain";

describe("VaultItemBuilder Pattern", () => {
  test("Builds LoginVaultItem with fluent API and default values", () => {
    const item = VaultItemBuilder.login()
      .setName("GitHub Account")
      .setUsername("octocat")
      .setPassword("s3cr3tP@ss")
      .setTotp("otpauth://totp/GitHub:octocat?secret=JBSWY3DPEHPK3PXP")
      .addUri("https://github.com/login", UriMatchMode.Domain)
      .setFavorite(true)
      .setNotes("Primary dev account")
      .addField({
        name: "PIN",
        value: "1234",
        type: CustomFieldType.Hidden,
      })
      .build();

    expect(item.type).toBe(VaultItemType.Login);
    expect(item.name).toBe("GitHub Account");
    expect(item.login.username).toBe("octocat");
    expect(item.login.password).toBe("s3cr3tP@ss");
    expect(item.login.totp).toBe(
      "otpauth://totp/GitHub:octocat?secret=JBSWY3DPEHPK3PXP",
    );
    expect(item.login.uris).toHaveLength(1);
    expect(item.login.uris?.[0]?.uri).toBe("https://github.com/login");
    expect(item.login.uris?.[0]?.match).toBe(UriMatchMode.Domain);
    expect(item.favorite).toBe(true);
    expect(item.notes).toBe("Primary dev account");
    expect(item.fields).toHaveLength(1);
    expect(item.fields[0]?.name).toBe("PIN");
    expect(item.id).toBeDefined();
    expect(item.creationDate).toBeDefined();
    expect(item.revisionDate).toBeDefined();
  });

  test("Builds CardVaultItem with card details", () => {
    const item = VaultItemBuilder.card()
      .setName("Visa Platinum")
      .setCardDetails({
        cardholderName: "John Doe",
        brand: "Visa",
        number: "4111111111111111",
        expMonth: "12",
        expYear: "2030",
        code: "123",
      })
      .build();

    expect(item.type).toBe(VaultItemType.Card);
    expect(item.name).toBe("Visa Platinum");
    expect(item.card.cardholderName).toBe("John Doe");
    expect(item.card.brand).toBe("Visa");
    expect(item.card.number).toBe("4111111111111111");
  });

  test("Builds SecureNoteVaultItem and IdentityVaultItem", () => {
    const note = VaultItemBuilder.note()
      .setName("Server Recovery Keys")
      .setNotes("key-1, key-2, key-3")
      .build();

    expect(note.type).toBe(VaultItemType.SecureNote);
    expect(note.name).toBe("Server Recovery Keys");
    expect(note.notes).toBe("key-1, key-2, key-3");

    const identity = VaultItemBuilder.identity()
      .setName("Personal Profile")
      .setIdentityDetails({
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        phone: "+1234567890",
      })
      .build();

    expect(identity.type).toBe(VaultItemType.Identity);
    expect(identity.identity.firstName).toBe("Jane");
    expect(identity.identity.lastName).toBe("Smith");
    expect(identity.identity.email).toBe("jane@example.com");
  });

  test("VaultItemBuilder.from clones and modifies existing items seamlessly", () => {
    const original = VaultItemBuilder.login()
      .setName("Old Name")
      .setUsername("user1")
      .setPassword("pass1")
      .build();

    const cloned = VaultItemBuilder.from(original)
      .setName("New Name")
      .setPassword("pass2")
      .build();

    expect(cloned.id).toBe(original.id);
    expect(cloned.name).toBe("New Name");
    expect(cloned.login.username).toBe("user1");
    expect(cloned.login.password).toBe("pass2");
  });
});
