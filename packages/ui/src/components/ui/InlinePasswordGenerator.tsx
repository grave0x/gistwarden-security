import { type Component, createSignal, onCleanup, onMount, Show } from "solid-js";
import { t } from "@/core/i18n.ts";
import { generatePassphrase, generatePassword } from "@gistwarden/domain";
import { GeneratorIcon, KeyIcon, ListIcon } from "@/icons/svg/index.ts";

export interface InlinePasswordGeneratorProps {
  readonly onGenerate: (password: string) => void;
}

export const InlinePasswordGenerator: Component<InlinePasswordGeneratorProps> = (
  props,
) => {
  const [isOpen, setIsOpen] = createSignal(false);
  let containerRef: HTMLDivElement | undefined;

  const toggleDropdown = () => {
    setIsOpen(!isOpen());
  };

  const handleGenerateRandom = () => {
    const res = generatePassword({
      length: 16,
      uppercase: true,
      lowercase: true,
      numbers: true,
      specials: true,
      avoidAmbiguous: false,
      minNumbers: 1,
      minSpecials: 1,
    });
    if (res.isOk()) {
      props.onGenerate(res.value);
    }
    setIsOpen(false);
  };

  const handleGeneratePassphrase = () => {
    const res = generatePassphrase({
      numWords: 4,
      wordSeparator: "-",
      capitalize: true,
      includeNumber: true,
    });
    if (res.isOk()) {
      props.onGenerate(res.value);
    }
    setIsOpen(false);
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (
      isOpen() &&
      containerRef &&
      e.target instanceof Node &&
      !containerRef.contains(e.target)
    ) {
      setIsOpen(false);
    }
  };

  onMount(() => {
    document.addEventListener("mousedown", handleClickOutside);
  });

  onCleanup(() => {
    document.removeEventListener("mousedown", handleClickOutside);
  });

  return (
    <div class="inline-generator-container" ref={containerRef}>
      <button
        type="button"
        class="action-btn input-action-btn"
        title={t("edit_gen_btn_title")}
        onClick={toggleDropdown}
      >
        <GeneratorIcon class="icon-inline" />
      </button>

      <Show when={isOpen()}>
        <div class="inline-generator-menu">
          <button
            type="button"
            class="inline-generator-item"
            onClick={handleGenerateRandom}
          >
            <KeyIcon class="icon-inline" />
            <span>{t("edit_gen_random_password")}</span>
          </button>
          <button
            type="button"
            class="inline-generator-item"
            onClick={handleGeneratePassphrase}
          >
            <ListIcon class="icon-inline" />
            <span>{t("edit_gen_passphrase")}</span>
          </button>
        </div>
      </Show>
    </div>
  );
};

export default InlinePasswordGenerator;
