import {
  type Component,
  createEffect,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { t } from "@/core/i18n.ts";

export interface SelectOption {
  value: string | number;
  label: string;
  isHeader?: boolean;
  disabled?: boolean;
}

interface SelectProps {
  id?: string;
  value?: string | number;
  onChange?: (e: {
    currentTarget: { value: string };
    target: { value: string };
  }) => void;
  options: SelectOption[];
  class?: string;
  disabled?: boolean;
  inFlow?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
}

export const Select: Component<SelectProps> = (props) => {
  const [isOpen, setIsOpen] = createSignal(false);
  const [searchQuery, setSearchQuery] = createSignal("");
  let containerRef: HTMLDivElement | undefined;
  let searchInputRef: HTMLInputElement | undefined;

  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target;
    if (
      containerRef &&
      target instanceof Node &&
      !containerRef.contains(target)
    ) {
      setIsOpen(false);
      setSearchQuery("");
    }
  };

  createEffect(() => {
    if (isOpen()) {
      setTimeout(() => searchInputRef?.focus(), 50);
    } else {
      setSearchQuery("");
    }
  });

  onMount(() => {
    document.addEventListener("click", handleClickOutside);
  });

  onCleanup(() => {
    document.removeEventListener("click", handleClickOutside);
  });

  const selectedOption = () => {
    return (
      props.options.find(
        (opt) => !opt.isHeader && String(opt.value) === String(props.value),
      ) ||
      props.options.find((opt) => !opt.isHeader) ||
      props.options[0]
    );
  };

  const filteredOptions = () => {
    const query = searchQuery().toLowerCase().trim();
    if (!query) return props.options;
    return props.options.filter(
      (opt) => opt.isHeader || opt.label.toLowerCase().includes(query),
    );
  };

  const handleSelect = (val: string | number) => {
    setIsOpen(false);
    setSearchQuery("");
    if (props.onChange) {
      props.onChange({
        currentTarget: { value: String(val) },
        target: { value: String(val) },
      });
    }
  };

  const shouldShowSearch = () => {
    return Boolean(props.searchable);
  };

  return (
    <div
      ref={containerRef}
      class={`select-container ${props.class || ""}`}
      id={props.id}
    >
      <button
        type="button"
        class="select-control d-flex align-center justify-between"
        onClick={() => !props.disabled && setIsOpen(!isOpen())}
        disabled={props.disabled}
      >
        <span class="select-value">{selectedOption()?.label || ""}</span>
        <div class={`select-arrow ${isOpen() ? "open" : ""}`}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      <div
        class={`select-dropdown-wrapper ${
          props.inFlow ? "in-flow" : "overlay"
        } ${isOpen() ? "is-open" : ""}`}
      >
        <div class="select-dropdown-inner">
          <div class="select-dropdown-options">
            <Show when={shouldShowSearch()}>
              <div class="select-search-wrapper">
                <input
                  ref={searchInputRef}
                  type="text"
                  class="select-search-input"
                  placeholder={
                    props.searchPlaceholder || t("select_search_placeholder")
                  }
                  value={searchQuery()}
                  onInput={(e) => setSearchQuery(e.currentTarget.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </Show>

            <For each={filteredOptions()}>
              {(opt) => (
                <Show
                  when={!opt.isHeader}
                  fallback={
                    <div class="select-dropdown-header">{opt.label}</div>
                  }
                >
                  <div
                    class={`select-dropdown-item ${
                      String(opt.value) === String(props.value)
                        ? "selected"
                        : ""
                    } ${opt.disabled ? "disabled" : ""}`}
                    onClick={() => !opt.disabled && handleSelect(opt.value)}
                  >
                    {opt.label}
                  </div>
                </Show>
              )}
            </For>

            <Show
              when={filteredOptions().filter((o) => !o.isHeader).length === 0}
            >
              <div class="select-dropdown-no-results">
                {t("select_no_results")}
              </div>
            </Show>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Select;
