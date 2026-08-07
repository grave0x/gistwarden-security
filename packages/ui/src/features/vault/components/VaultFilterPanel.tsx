import { type Component, createSignal, For, Show } from "solid-js";
import { type Folder, type FolderId, VaultItemType } from "@gistwarden/domain";
import { getVaultItemTypeLabel } from "@/features/vault/vault-utils.ts";
import { t } from "@/core/i18n.ts";
import {
  ChevronDownIcon,
  FolderIcon,
  ListIcon,
} from "@/icons/svg/index.ts";
import { getAllVaultItemStrategies } from "@/features/vault/registry/vault-item-registry.ts";
import { createDefaultVaultItem } from "@/features/vault/item-edit/vault-edit-helper.ts";

export interface VaultFilterPanelProps {
  showFilterPanel: boolean;
  selectedFilterType: VaultItemType | "all";
  onSelectFilterType: (type: VaultItemType | "all") => void;
  folders: Folder[];
  selectedFolderId: FolderId | "no_folder";
  onSelectFolderId: (folderId: FolderId | "no_folder") => void;
}


export const VaultFilterPanel: Component<VaultFilterPanelProps> = (props) => {
  const [showFolderDropdown, setShowFolderDropdown] = createSignal(false);
  const [showTypeDropdown, setShowTypeDropdown] = createSignal(false);

  const handleSelectType = (type: VaultItemType | "all") => {
    props.onSelectFilterType(type);
    setShowTypeDropdown(false);
  };

  const handleSelectFolder = (folderId: FolderId | "no_folder") => {
    props.onSelectFolderId(folderId);
    setShowFolderDropdown(false);
  };

  const getFolderLabel = () => {
    if (props.selectedFolderId === "no_folder") {
      return t("items_with_no_folder");
    }
    const found = props.folders.find((f) => f.id === props.selectedFolderId);
    return found ? found.name : t("items_with_no_folder");
  };

  return (
    <Show when={props.showFilterPanel}>
      <div class="filter-panel">
        {/* Folder Dropdown - Only show when at least 1 folder exists */}
        <Show when={props.folders.length > 0}>
          <div class="filter-dropdown-container">
            <div
              class="filter-dropdown-trigger"
              onClick={() => {
                setShowFolderDropdown(!showFolderDropdown());
                setShowTypeDropdown(false);
              }}
            >
              <FolderIcon class="dropdown-icon" />
              <span class="dropdown-label">{getFolderLabel()}</span>
              <ChevronDownIcon
                class={`chevron-icon ${showFolderDropdown() ? "open" : ""}`}
              />
            </div>
            <Show when={showFolderDropdown()}>
              <div class="filter-dropdown-menu">
                <For each={props.folders}>
                  {(folder) => (
                    <div
                      class={`dropdown-item ${
                        props.selectedFolderId === folder.id ? "selected" : ""
                      }`}
                      onClick={() => handleSelectFolder(folder.id)}
                    >
                      <FolderIcon class="item-icon" />
                      <span>{folder.name}</span>
                    </div>
                  )}
                </For>
                <div
                  class={`dropdown-item ${
                    props.selectedFolderId === "no_folder" ? "selected" : ""
                  }`}
                  onClick={() => handleSelectFolder("no_folder")}
                >
                  <FolderIcon class="item-icon" />
                  <span>{t("items_with_no_folder")}</span>
                </div>
              </div>
            </Show>
          </div>
        </Show>

        {/* Type Dropdown */}
        <div class="filter-dropdown-container">
          <div
            class="filter-dropdown-trigger"
            onClick={() => {
              setShowTypeDropdown(!showTypeDropdown());
              setShowFolderDropdown(false);
            }}
          >
            <ListIcon class="dropdown-icon" />
            <span class="dropdown-label">
              {getVaultItemTypeLabel(props.selectedFilterType)}
            </span>
            <ChevronDownIcon
              class={`chevron-icon ${showTypeDropdown() ? "open" : ""}`}
            />
          </div>
          <Show when={showTypeDropdown()}>
            <div class="filter-dropdown-menu">
              <div
                class={`dropdown-item ${
                  props.selectedFilterType === "all" ? "selected" : ""
                }`}
                onClick={() => handleSelectType("all")}
              >
                <ListIcon class="item-icon" />
                <span>{t("vault_filter_all_types")}</span>
              </div>
              <For each={getAllVaultItemStrategies()}>
                {(strategy) => (
                  <div
                    class={`dropdown-item ${
                      props.selectedFilterType === strategy.type ? "selected" : ""
                    }`}
                    onClick={() => handleSelectType(strategy.type)}
                  >
                    <span class="item-icon">
                      {strategy.renderIcon(createDefaultVaultItem(strategy.type))}
                    </span>
                    <span>{getVaultItemTypeLabel(strategy.type)}</span>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>
      </div>
    </Show>
  );
};
