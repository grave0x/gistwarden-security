import type { Component, JSX } from "solid-js";
import type { VaultItem, VaultItemType } from "@gistwarden/domain";
import type { ItemEditFormState } from "@/features/vault/item-edit/vault-edit-helper.ts";

export interface DetailComponentProps {
  item: VaultItem;
  onCopy: (text: string, type: string) => Promise<void>;
}

export interface EditComponentProps {
  formState: ItemEditFormState;
  updateForm: <K extends keyof ItemEditFormState>(
    key: K,
    value: ItemEditFormState[K],
  ) => void;
  onDeleteFido?: (credId: string) => void;
  scanning?: boolean;
  onScanQr?: () => void;
}

export interface CopyMenuProps {
  item: VaultItem;
  onCopyText: (text: string, type: string, e: MouseEvent) => void;
  onCopyTotpDirect: (item: VaultItem, e: MouseEvent) => void;
}

export interface VaultItemStrategy {
  readonly type: VaultItemType;
  getAddTitle(): string;
  getEditTitle(): string;
  getDetailTitle(): string;
  getToastMsg(isEdit: boolean): string;
  renderIcon(item: VaultItem): JSX.Element;
  getSubtitle(item: VaultItem): string;
  populateFormState?(item: VaultItem, state: ItemEditFormState): void;
  mapToPayload?(
    validatedForm: ItemEditFormState,
    selectedItem?: VaultItem | null,
  ): Record<string, unknown>;
  readonly DetailComponent: Component<DetailComponentProps>;
  readonly EditComponent: Component<EditComponentProps>;
  readonly renderCopyMenu?: Component<CopyMenuProps>;
}
