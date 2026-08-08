import { type Component, createEffect, createSignal, For, Show } from "solid-js";
import { t } from "@/core/i18n.ts";
import {
  GUIDE_STRUCTURE,
  type GuideCategoryDef,
} from "@/features/guide/guide-router.ts";
import {
  ChevronRightIcon,
  CloseIcon,
  QuestionIcon,
  SearchIcon,
} from "@/icons/svg/index.ts";

export interface GuideTreeSidebarProps {
  readonly currentRoute: string;
  readonly onNavigate: (route: string) => void;
}

export const GuideTreeSidebar: Component<GuideTreeSidebarProps> = (props) => {
  const activeCategoryId = () =>
    props.currentRoute.split("/")[0] || "getting-started";

  const [searchQuery, setSearchQuery] = createSignal("");
  const [expandedCategories, setExpandedCategories] = createSignal<
    Record<string, boolean>
  >({
    "getting-started": true,
  });

  // Auto-expand category containing currentRoute (single open accordion)
  createEffect(() => {
    const route = props.currentRoute;
    const categoryId = route.split("/")[0];
    if (categoryId) {
      setExpandedCategories({
        [categoryId]: true,
      });
    }
  });

  const toggleCategory = (catId: string) => {
    const isCurrentlyExpanded = !!expandedCategories()[catId];
    if (isCurrentlyExpanded) {
      setExpandedCategories({});
      return;
    }

    setExpandedCategories({ [catId]: true });

    // Auto-navigate to first child item
    const cat = GUIDE_STRUCTURE.find((c) => c.id === catId);
    if (cat && cat.items.length > 0 && cat.items[0]) {
      props.onNavigate(cat.items[0].route);
    }
  };

  const getFilteredStructure = (): GuideCategoryDef[] => {
    const q = searchQuery().trim().toLowerCase();
    if (!q) return [...GUIDE_STRUCTURE];

    return GUIDE_STRUCTURE.map((cat) => {
      const catMatch = t(cat.titleKey).toLowerCase().includes(q);
      const filteredItems = cat.items.filter((item) =>
        catMatch || t(item.titleKey).toLowerCase().includes(q)
      );

      return {
        ...cat,
        items: filteredItems,
      };
    }).filter((cat) => cat.items.length > 0);
  };

  return (
    <aside class="guide-tree-sidebar">
      {/* Search Input Box */}
      <div class="sidebar-search-box">
        <span class="search-icon">
          <SearchIcon size={14} />
        </span>
        <input
          type="text"
          class="sidebar-search-input"
          placeholder={t("guide_search_placeholder")}
          value={searchQuery()}
          onInput={(e) => setSearchQuery(e.currentTarget.value)}
        />
        <Show when={searchQuery().length > 0}>
          <button
            type="button"
            class="clear-search-btn"
            onClick={() => setSearchQuery("")}
          >
            <CloseIcon size={14} />
          </button>
        </Show>
      </div>

      {/* Accordion Categories List */}
      <div class="sidebar-categories-tree">
        <For each={getFilteredStructure()}>
          {(cat) => {
            const isExpanded = () =>
              searchQuery().length > 0 || !!expandedCategories()[cat.id];
            const hasActiveChild = () =>
              cat.items.some((item) => props.currentRoute === item.route);
            const CatIcon = cat.icon;

            return (
              <div
                class={`category-accordion-group ${
                  isExpanded() ? "expanded" : "collapsed"
                }`}
              >
                {/* Parent Menu Header */}
                <button
                  type="button"
                  class={`category-parent-header ${
                    hasActiveChild() && !isExpanded() ? "has-active-child" : ""
                  }`}
                  onClick={() => toggleCategory(cat.id)}
                >
                  <span class="cat-icon">
                    <CatIcon size={16} />
                  </span>
                  <span class="cat-title">{t(cat.titleKey)}</span>
                  <span class="cat-badge">{cat.items.length}</span>
                  <ChevronRightIcon
                    size={14}
                    class={`chevron-icon ${isExpanded() ? "open" : ""}`}
                  />
                </button>

                {/* Sub-menu Items List */}
                <div class="subcategory-items-wrapper">
                  <div class="subcategory-items-list">
                    <For each={cat.items}>
                      {(item) => {
                        const isActive = () => props.currentRoute === item.route;
                        const ItemIcon = item.icon;

                        return (
                          <button
                            type="button"
                            class={`sub-item-link ${isActive() ? "active" : ""}`}
                            onClick={() => props.onNavigate(item.route)}
                          >
                            <span class="sub-item-icon">
                              <ItemIcon size={14} />
                            </span>
                            <span class="sub-item-label">{t(item.titleKey)}</span>
                          </button>
                        );
                      }}
                    </For>
                  </div>
                </div>
              </div>
            );
          }}
        </For>

        <Show when={getFilteredStructure().length === 0}>
          <div class="sidebar-no-results">
            <QuestionIcon size={28} />
            <p>{t("guide_search_no_results")}</p>
          </div>
        </Show>
      </div>
    </aside>
  );
};
