import type { VaultField } from "@gistwarden/domain";
import { CustomFieldType } from "@gistwarden/domain";
import { type Component, createSignal, For, Show } from "solid-js";
import CustomFieldModal from "@/components/ui/CustomFieldModal.tsx";
import GuideHelpButton from "@/components/ui/GuideHelpButton.tsx";
import { t } from "@/core/i18n.ts";
import { DragIcon, EditIcon, PlusIcon, TrashIcon } from "@/icons/svg/index.ts";

interface CustomFieldsEditProps {
  fields: VaultField[];
  onChange: (fields: VaultField[]) => void;
}

const FIELD_PREVIEW_RESOLVERS: Record<
  CustomFieldType,
  (field: VaultField) => string
> = {
  [CustomFieldType.Hidden]: () => "••••••••",
  [CustomFieldType.Boolean]: (f) =>
    f.value === "true" || f.value === "1" ? "✓ True" : "✗ False",
  [CustomFieldType.Linked]: (f) => `🔗 ${f.value || ""}`,
  [CustomFieldType.Text]: (f) => f.value || t("detail_no_value"),
  [CustomFieldType.Divider]: () => "",
};

function getCustomFieldPreviewText(field: VaultField): string {
  const resolver =
    FIELD_PREVIEW_RESOLVERS[field.type] ??
    FIELD_PREVIEW_RESOLVERS[CustomFieldType.Text];
  return resolver(field);
}

export const CustomFieldsEdit: Component<CustomFieldsEditProps> = (props) => {
  // Drag and drop states
  const [draggedIndex, setDraggedIndex] = createSignal<number | null>(null);

  // Modal states
  const [showEditFieldModal, setShowEditFieldModal] = createSignal(false);
  const [selectedFieldIndex, setSelectedFieldIndex] = createSignal<
    number | null
  >(null);

  const initialField = (): VaultField | null => {
    const idx = selectedFieldIndex();
    return idx === null ? null : (props.fields[idx] ?? null);
  };

  const handleOpenAddField = () => {
    setSelectedFieldIndex(null);
    setShowEditFieldModal(true);
  };

  const handleOpenEditField = (index: number) => {
    setSelectedFieldIndex(index);
    setShowEditFieldModal(true);
  };

  const handleCloseModal = () => {
    setShowEditFieldModal(false);
    setSelectedFieldIndex(null);
  };

  const handleSaveField = (savedField: VaultField) => {
    const idx = selectedFieldIndex();
    if (idx === null) {
      props.onChange([...props.fields, savedField]);
    } else {
      const next = [...props.fields];
      next[idx] = savedField;
      props.onChange(next);
    }
    setShowEditFieldModal(false);
    setSelectedFieldIndex(null);
  };

  const handleRemoveField = (index: number) => {
    const next = [...props.fields];
    next.splice(index, 1);
    props.onChange(next);
  };

  const handleDragStart = (index: number, e: DragEvent) => {
    setDraggedIndex(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(index));
    }
  };

  const handleDragOver = (index: number, e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }
    const fromIdx = draggedIndex();
    if (fromIdx === null || fromIdx === index) return;

    const next = [...props.fields];
    const item = next.splice(fromIdx, 1)[0];
    if (item) {
      next.splice(index, 0, item);
      setDraggedIndex(index);
      props.onChange(next);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <>
      <div class="detail-section-title d-flex align-items-center gap-6">
        <span>{t("edit_label_fields")}</span>
        <GuideHelpButton route="vault-management/custom-fields" />
      </div>
      <div class="card mb-16">
        <Show when={props.fields.length > 0}>
          <div class="mb-12">
            <For each={props.fields}>
              {(field, index) => (
                <Show
                  when={field.type === CustomFieldType.Divider}
                  fallback={
                    <div
                      draggable="true"
                      onDragStart={(e) => handleDragStart(index(), e)}
                      onDragOver={(e) => handleDragOver(index(), e)}
                      onDragEnd={handleDragEnd}
                      class={`draggable-field-row ${
                        draggedIndex() === index() ? "dragging" : ""
                      }`}
                    >
                      <div class="d-flex justify-between align-center">
                        <div class="d-flex align-center gap-6">
                          <div class="cursor-grab d-flex align-center justify-center text-muted">
                            <DragIcon class="icon-inline" />
                          </div>
                          <span class="font-w-600 font-sz-13">
                            {field.name}
                          </span>
                          <span class="field-sub-value">
                            {getCustomFieldPreviewText(field)}
                          </span>
                        </div>
                        <div class="d-flex gap-8">
                          <button
                            type="button"
                            class="action-btn edit-field-btn"
                            onClick={() => handleOpenEditField(index())}
                            title={t("btn_edit")}
                          >
                            <EditIcon class="icon-inline" />
                          </button>
                          <button
                            type="button"
                            class="action-btn delete-field-btn"
                            onClick={() => handleRemoveField(index())}
                            title={t("btn_delete")}
                          >
                            <TrashIcon class="icon-inline" />
                          </button>
                        </div>
                      </div>
                    </div>
                  }
                >
                  {/* Divider Edit Row */}
                  <div
                    draggable="true"
                    onDragStart={(e) => handleDragStart(index(), e)}
                    onDragOver={(e) => handleDragOver(index(), e)}
                    onDragEnd={handleDragEnd}
                    class={`draggable-field-row ${
                      draggedIndex() === index() ? "dragging" : ""
                    }`}
                  >
                    <div class="d-flex justify-between align-center">
                      <div class="d-flex align-center gap-6 flex-1">
                        <div class="cursor-grab d-flex align-center justify-center text-muted">
                          <DragIcon class="icon-inline" />
                        </div>
                        <span class="divider-row-title">{field.name}</span>
                      </div>
                      <div class="d-flex gap-8">
                        <button
                          type="button"
                          class="action-btn edit-field-btn"
                          onClick={() => handleOpenEditField(index())}
                          title={t("btn_edit")}
                        >
                          <EditIcon class="icon-inline" />
                        </button>
                        <button
                          type="button"
                          class="action-btn delete-field-btn"
                          onClick={() => handleRemoveField(index())}
                          title={t("btn_delete")}
                        >
                          <TrashIcon class="icon-inline" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Show>
              )}
            </For>
          </div>
        </Show>

        <button
          type="button"
          class="add-field-btn"
          onClick={handleOpenAddField}
        >
          <PlusIcon class="icon-inline mr-4" />
          {t("edit_btn_add_field")}
        </button>
      </div>

      <CustomFieldModal
        isOpen={showEditFieldModal()}
        isEdit={selectedFieldIndex() !== null}
        initialField={initialField()}
        onClose={handleCloseModal}
        onSave={handleSaveField}
      />
    </>
  );
};

export default CustomFieldsEdit;
