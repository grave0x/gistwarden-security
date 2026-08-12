import type { Component } from "solid-js";
import { mergeProps } from "solid-js";
import type { IconProps } from "@/icons/svg/types.ts";

export const EnIcon: Component<IconProps> = (props) => {
  const merged = mergeProps({ size: 16 }, props);
  const size = () => merged.size || merged.width || 16;

  return (
    <svg
      width={size()}
      height={size()}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect width="24" height="24" rx="6" fill="#2563EB" opacity="0.15" />
      <text
        x="12"
        y="15.5"
        fill="#2563EB"
        font-size="10"
        font-weight="700"
        font-family="system-ui, sans-serif"
        text-anchor="middle"
      >
        EN
      </text>
    </svg>
  );
};

export default EnIcon;
