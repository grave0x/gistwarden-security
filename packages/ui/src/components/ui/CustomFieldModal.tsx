import type { TranslationKey, VaultField } from "@gistwarden/domain";
import {
  CustomFieldType,
  LOGIN_LINKED_FIELDS,
  LoginLinkedId,
} from "@gistwarden/domain";
import { createEffect, createSignal, type JSX } from "solid-js";
import BaseSlideModal from "@/components/ui/BaseSlideModal.tsx";
import Button from "@/components/ui/Button.tsx";
import Checkbox from "@/components/ui/Checkbox.tsx";
import Input from "@/components/ui/Input.tsx";
import Select from "@/components/ui/Select.tsx";
import { t } from "@/core/i18n.ts";

export interface CustomFieldRenderContext {
  value: () => string;
  setValue: (val: string) => void;
  onKeyDown: (e: KeyboardEvent) => void;
}

export interface CustomFieldStrategy {
  type: CustomFieldType;
  labelKey: TranslationKey;
  placeholderKey?: TranslationKey;
  getDefaultValue: () => string;
  normalizeInitialValue: (field: VaultField) => string;
  prepareSaveValue: (rawVal: string) => { value: string; linkedId?: number };
  renderValueInput: (ctx: CustomFieldRenderContext) => JSX.Element;
}

const linkedFieldOptions = () =>
  LOGIN_LINKED_FIELDS.map((f) => ({
    value: String(f.id),
    label: t(f.labelKey),
  }));

const CUSTOM_FIELD_STRATEGIES: Record<CustomFieldType, CustomFieldStrategy> = {
  [CustomFieldType.Text]: {
    type: CustomFieldType.Text,
    labelKey: "edit_field_type_text",
    getDefaultValue: () => "",
    normalizeInitialValue: (field) => field.value || "",
    prepareSaveValue: (rawVal) => ({ value: rawVal.trim() }),
    renderValueInput: (ctx) => (
      <div class="form-group">
        <label>{t("edit_field_val_placeholder")}</label>
        <Input
          type="text"
          placeholder={`${t("edit_field_val_placeholder")}...`}
          value={ctx.value()}
          onInput={(e) => ctx.setValue(e.currentTarget.value)}
          onKeyDown={ctx.onKeyDown}
        />
      </div>
    ),
  },
  [CustomFieldType.Hidden]: {
    type: CustomFieldType.Hidden,
    labelKey: "edit_field_type_hidden",
    getDefaultValue: () => "",
    normalizeInitialValue: (field) => field.value || "",
    prepareSaveValue: (rawVal) => ({ value: rawVal.trim() }),
    renderValueInput: (ctx) => (
      <div class="form-group">
        <label>{t("edit_field_val_placeholder")}</label>
        <Input
          type="password"
          placeholder={`${t("edit_field_val_placeholder")}...`}
          value={ctx.value()}
          onInput={(e) => ctx.setValue(e.currentTarget.value)}
          onKeyDown={ctx.onKeyDown}
        />
      </div>
    ),
  },
  [CustomFieldType.Boolean]: {
    type: CustomFieldType.Boolean,
    labelKey: "edit_field_type_boolean",
    getDefaultValue: () => "false",
    normalizeInitialValue: (field) =>
      field.value === "true" || field.value === "1" ? "true" : "false",
    prepareSaveValue: (rawVal) => ({
      value: rawVal === "true" || rawVal === "1" ? "true" : "false",
    }),
    renderValueInput: (ctx) => (
      <div class="form-group">
        <label>{t("edit_field_val_placeholder")}</label>
        <div class="card p-2">
          <Checkbox
            id="custom-field-boolean-val"
            checked={ctx.value() === "true" || ctx.value() === "1"}
            onChange={(checked) => ctx.setValue(checked ? "true" : "false")}
            label={
              ctx.value() === "true" || ctx.value() === "1" ? "True" : "False"
            }
          />
        </div>
      </div>
    ),
  },
  [CustomFieldType.Linked]: {
    type: CustomFieldType.Linked,
    labelKey: "edit_field_type_linked",
    getDefaultValue: () => "username",
    normalizeInitialValue: (field) => {
      if (field.linkedId) {
        const found = LOGIN_LINKED_FIELDS.find((f) => f.id === field.linkedId);
        return found ? found.key : "username";
      }
      return field.value || "username";
    },
    prepareSaveValue: (rawVal) => {
      const matchedField =
        LOGIN_LINKED_FIELDS.find(
          (f) => f.key === rawVal || String(f.id) === rawVal,
        ) ?? LOGIN_LINKED_FIELDS[0];
      if (matchedField) {
        return { value: matchedField.key, linkedId: matchedField.id };
      }
      return { value: "username", linkedId: LoginLinkedId.Username };
    },
    renderValueInput: (ctx) => (
      <div class="form-group">
        <label>{t("edit_field_type_linked")}</label>
        <Select
          inFlow
          value={
            LOGIN_LINKED_FIELDS.find(
              (f) => f.key === ctx.value() || String(f.id) === ctx.value(),
            )?.id ?? LoginLinkedId.Username
          }
          onChange={(e) => {
            const selId = Number(e.currentTarget.value);
            const matched = LOGIN_LINKED_FIELDS.find((f) => f.id === selId);
            ctx.setValue(matched ? matched.key : "username");
          }}
          options={linkedFieldOptions()}
        />
      </div>
    ),
  },
  [CustomFieldType.Divider]: {
    type: CustomFieldType.Divider,
    labelKey: "edit_field_type_divider",
    placeholderKey: "edit_field_modal_placeholder_divider",
    getDefaultValue: () => "",
    normalizeInitialValue: () => "",
    prepareSaveValue: () => ({ value: "" }),
    renderValueInput: () => null,
  },
};

function isCustomFieldType(val: number): val is CustomFieldType {
  return val in CUSTOM_FIELD_STRATEGIES;
}

interface CustomFieldModalProps {
  isOpen: boolean;
  isEdit: boolean;
  initialField: VaultField | null;
  onClose: () => void;
  onSave: (field: VaultField) => void;
}

export default function CustomFieldModal(props: CustomFieldModalProps) {
  const [name, setName] = createSignal("");
  const [value, setValue] = createSignal("");
  const [type, setType] = createSignal<CustomFieldType>(CustomFieldType.Text);

  const currentStrategy = () =>
    CUSTOM_FIELD_STRATEGIES[type()] ??
    CUSTOM_FIELD_STRATEGIES[CustomFieldType.Text];

  const fieldTypeOptions = () =>
    Object.values(CUSTOM_FIELD_STRATEGIES).map((strat) => ({
      value: String(strat.type),
      label: t(strat.labelKey),
    }));

  createEffect(() => {
    if (props.isOpen) {
      if (props.initialField) {
        const fieldType = props.initialField.type ?? CustomFieldType.Text;
        const strat =
          CUSTOM_FIELD_STRATEGIES[fieldType] ??
          CUSTOM_FIELD_STRATEGIES[CustomFieldType.Text];
        setName(props.initialField.name || "");
        setValue(strat.normalizeInitialValue(props.initialField));
        setType(fieldType);
      } else {
        const strat = CUSTOM_FIELD_STRATEGIES[CustomFieldType.Text];
        setName("");
        setValue(strat.getDefaultValue());
        setType(CustomFieldType.Text);
      }
    }
  });

  const isFormValid = () => name().trim().length > 0;

  return (
    <BaseSlideModal
      isOpen={props.isOpen}
      onClose={props.onClose}
      usePortal
      title={
        props.isEdit
          ? t("edit_field_modal_title_edit")
          : t("edit_field_modal_title_add")
      }
    >
      {(triggerClose) => {
        const handleSave = () => {
          const trimmedName = name().trim();
          if (!trimmedName) {
            return;
          }

          const { value: finalValue, linkedId } =
            currentStrategy().prepareSaveValue(value());

          triggerClose(() => {
            props.onSave({
              name: trimmedName,
              value: finalValue,
              type: type(),
              linkedId,
            });
          });
        };

        const handleSubmit = (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          if (isFormValid()) {
            handleSave();
          }
        };

        const handleTypeChange = (newTypeVal: number) => {
          if (isCustomFieldType(newTypeVal)) {
            const validStrat = CUSTOM_FIELD_STRATEGIES[newTypeVal];
            setType(validStrat.type);
            setValue(validStrat.getDefaultValue());
          }
        };

        const getPlaceholder = () => {
          const placeholderKey = currentStrategy().placeholderKey;
          return placeholderKey
            ? t(placeholderKey)
            : t("edit_field_modal_placeholder_name");
        };

        return (
          <form onSubmit={handleSubmit}>
            <div class="modal-panel-body overflow-visible">
              <div class="form-group">
                <label>{t("edit_field_modal_label_type")}</label>
                <Select
                  inFlow
                  value={type()}
                  onChange={(e) =>
                    handleTypeChange(parseInt(e.currentTarget.value, 10))
                  }
                  options={fieldTypeOptions()}
                />
              </div>

              <div class="form-group">
                <label>{t("edit_field_name_placeholder")}</label>
                <Input
                  type="text"
                  placeholder={getPlaceholder()}
                  value={name()}
                  onInput={(e) => setName(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.stopPropagation();
                    }
                  }}
                />
              </div>

              {currentStrategy().renderValueInput({
                value,
                setValue,
                onKeyDown: (e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                  }
                },
              })}
            </div>

            <div class="modal-panel-footer d-flex gap-8">
              <Button type="submit" variant="primary" disabled={!isFormValid()}>
                {props.isEdit ? t("btn_save") : t("btn_create")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => triggerClose()}
              >
                {t("btn_cancel")}
              </Button>
            </div>
          </form>
        );
      }}
    </BaseSlideModal>
  );
}
