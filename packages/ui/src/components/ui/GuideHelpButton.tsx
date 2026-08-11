import type { Component } from "solid-js";
import { t } from "@/core/i18n.ts";
import { getAssetUrl, isExtension } from "@/core/runtime.ts";
import { openTab } from "@/core/tabs.ts";
import { QuestionIcon } from "@/icons/svg/index.ts";

export interface GuideHelpButtonProps {
  readonly route: string;
  readonly title?: string;
  readonly size?: number;
  readonly class?: string;
}

export const GuideHelpButton: Component<GuideHelpButtonProps> = (props) => {
  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isExtension()) {
      openTab(getAssetUrl(`guide.html#${props.route || ""}`));
    } else {
      const baseUrl = window.location.origin + window.location.pathname;
      const targetUrl = props.route
        ? `${baseUrl}#/guide/${props.route}`
        : `${baseUrl}#/guide`;
      openTab(targetUrl);
    }
  };

  const isLg = () => (props.size || 14) > 14;

  return (
    <button
      type="button"
      class={`action-btn text-muted hover-text-primary guide-help-btn ${isLg() ? "guide-help-btn-lg" : ""} ${props.class || ""}`}
      title={props.title || t("settings_user_guide")}
      onClick={handleClick}
    >
      <QuestionIcon size={props.size || 14} />
    </button>
  );
};

export default GuideHelpButton;
