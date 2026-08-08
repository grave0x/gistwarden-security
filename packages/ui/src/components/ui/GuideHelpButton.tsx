import type { Component } from "solid-js";
import { openTab } from "@/core/tabs.ts";
import { getAssetUrl, isExtension } from "@/core/runtime.ts";
import { t } from "@/core/i18n.ts";
import { QuestionIcon } from "@/icons/svg/index.ts";
import { navigate } from "@/core/navigation.ts";
import { View } from "@gistwarden/domain";

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
      openTab(getAssetUrl(`guide.html#${props.route}`));
    } else {
      if (props.route) {
        window.location.hash = `#/guide/${props.route}`;
      } else {
        navigate(View.Guide);
      }
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
