import { t } from "@gistwarden/domain";
import { type Component, createSignal, Show } from "solid-js";
import { Portal } from "solid-js/web";
import Button from "./Button.tsx";
import Input from "./Input.tsx";
import SafeHtml from "./SafeHtml.tsx";

export interface TypedConfirmModalProps {
  readonly isOpen: boolean;
  readonly title: string;
  readonly messageHtml: string;
  readonly requiredWord: string;
  readonly placeholder?: string;
  readonly confirmButtonText: string;
  readonly variant?: "danger" | "primary" | "secondary";
  readonly onClose: () => void;
  readonly onConfirm: () => Promise<void>;
}

export const TypedConfirmModal: Component<TypedConfirmModalProps> = (props) => {
  const [confirmText, setConfirmText] = createSignal("");

  const handleClose = () => {
    setConfirmText("");
    props.onClose();
  };

  const handleConfirm = async () => {
    if (
      confirmText().trim().toUpperCase() === props.requiredWord.toUpperCase()
    ) {
      setConfirmText("");
      await props.onConfirm();
    }
  };

  const isMatched = () =>
    confirmText().trim().toUpperCase() === props.requiredWord.toUpperCase();

  return (
    <Show when={props.isOpen}>
      <Portal>
        <div class="confirm-modal-backdrop" onClick={handleClose}>
          <div
            class={`confirm-modal-box type-${props.variant || "danger"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 class="confirm-modal-title">{props.title}</h4>
            <SafeHtml
              tag="p"
              class="confirm-modal-message"
              html={props.messageHtml}
            />
            <div class="form-group mt-12 mb-16">
              <Input
                type="text"
                placeholder={props.placeholder || `${props.requiredWord}...`}
                value={confirmText()}
                onInput={(e) => setConfirmText(e.currentTarget.value)}
                autofocus
              />
            </div>
            <div class="confirm-modal-actions">
              <Button
                variant={props.variant || "danger"}
                disabled={!isMatched()}
                onClick={handleConfirm}
              >
                {props.confirmButtonText}
              </Button>
              <Button variant="secondary" onClick={handleClose}>
                {t("btn_cancel")}
              </Button>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
};

export default TypedConfirmModal;
