import { createEffect, createSignal } from "solid-js";
import { asFolderId, type Folder, type FolderId } from "@gistwarden/domain";
import { t } from "@/core/i18n.ts";
import Button from "@/components/ui/Button.tsx";
import BaseSlideModal from "@/components/ui/BaseSlideModal.tsx";
import Select, { type SelectOption } from "@/components/ui/Select.tsx";


export interface MoveToFolderModalProps {
  isOpen: boolean;
  folders: Folder[];
  onClose: () => void;
  onConfirm: (folderId: FolderId | null) => Promise<boolean>;
}


export default function MoveToFolderModal(props: MoveToFolderModalProps) {
  const [selectedFolderId, setSelectedFolderId] = createSignal<FolderId | "no_folder">("no_folder");

  createEffect(() => {
    if (props.isOpen) {
      setSelectedFolderId("no_folder");
    }
  });

  const getOptions = (): SelectOption[] => {
    const defaultOption: SelectOption = {
      value: "no_folder",
      label: t("folder_no_folder_option"),
    };
    const folderOptions: SelectOption[] = props.folders.map((f) => ({
      value: f.id,
      label: f.name,
    }));
    return [defaultOption, ...folderOptions];
  };

  return (
    <BaseSlideModal
      isOpen={props.isOpen}
      onClose={props.onClose}
      usePortal
      title={t("vault_move_to_folder_modal_title")}
    >
      {(triggerClose) => {
        const handleSubmit = async (e: Event) => {
          e.preventDefault();
          const currentId = selectedFolderId();
          const targetId = currentId === "no_folder" ? null : currentId;
          const success = await props.onConfirm(targetId);

          if (success) {
            triggerClose();
          }
        };

        return (
          <form onSubmit={handleSubmit} class="modal-panel-body">
            <div class="form-group pos-relative">
              <label for="move-folder-select">
                {t("folder_select_label")}
              </label>
              <Select
                id="move-folder-select"
                value={selectedFolderId()}
                options={getOptions()}
                onChange={(e) => {
                  const val = e.currentTarget.value;
                  setSelectedFolderId(val === "no_folder" ? "no_folder" : asFolderId(val));
                }}

                class="w-100"
                inFlow={true}
              />
            </div>

            <div class="modal-panel-footer p-0 border-none d-flex justify-content-between align-items-center w-100">
              <div class="d-flex gap-8">
                <Button type="submit" variant="primary">
                  {t("btn_save")}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => triggerClose()}
                >
                  {t("btn_cancel")}
                </Button>
              </div>
            </div>
          </form>
        );
      }}
    </BaseSlideModal>
  );
}
