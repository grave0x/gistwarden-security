export const notificationToastCss = `
:host {
  all: initial;
  display: block !important;
  position: fixed !important;
  top: 20px !important;
  right: 20px !important;
  width: 340px !important;
  max-width: calc(100vw - 40px) !important;
  z-index: 2147483647 !important;
  pointer-events: auto !important;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  box-sizing: border-box !important;
}

*, *::before, *::after {
  box-sizing: border-box;
}

.toast-card {
  pointer-events: auto;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, var(--surface-card, #232f45) 0%, var(--bg, #0f172b) 100%);
  color: var(--white, #f1f5f9);
  border: 1px solid var(--border-translucent, rgba(255, 255, 255, 0.12));
  border-left: 4px solid var(--primary, #175ddc);
  border-radius: var(--radius-lg, 12px);
  box-shadow: 0 12px 28px -4px rgba(0, 0, 0, 0.45), 0 4px 10px -2px rgba(0, 0, 0, 0.25);
  padding: 16px;
  padding-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  animation: gw-toast-slide 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  backdrop-filter: blur(12px);
}

.toast-card.closing {
  animation: gw-toast-slide-out 0.2s cubic-bezier(0.4, 0, 1, 1) forwards;
}

@keyframes gw-toast-slide {
  from {
    opacity: 0;
    transform: translateX(40px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes gw-toast-slide-out {
  from {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateX(40px) scale(0.95);
  }
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.header-title {
  font-size: var(--font-size-13, 13px);
  font-weight: 600;
  color: var(--text-muted, #8496b0);
}

.close-btn {
  pointer-events: auto !important;
  background: transparent;
  border: none;
  color: var(--text-muted, #8496b0);
  font-size: 22px;
  cursor: pointer !important;
  line-height: 1;
  padding: 2px 6px;
  border-radius: var(--radius-xs, 4px);
  transition: color 0.15s ease, background-color 0.15s ease;
  user-select: none;
  -webkit-user-select: none;
  z-index: 10;
}

.close-btn:hover {
  color: var(--white, #f1f5f9);
  background-color: var(--white-translucent-5, rgba(255, 255, 255, 0.08));
}

.body-content {
  font-size: var(--font-size-14, 14px);
  line-height: 1.5;
  color: var(--text, #f1f5f9);
  word-break: break-word;
}

.user-highlight {
  font-weight: 700;
  color: var(--primary-accent, #65abff);
}

.select-label {
  margin-bottom: 4px;
}

.accounts-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 6px;
  max-height: 180px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--white-translucent-20, rgba(255, 255, 255, 0.2)) transparent;
}

.accounts-list::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

.accounts-list::-webkit-scrollbar-track {
  background: transparent;
}

.accounts-list::-webkit-scrollbar-thumb {
  background: var(--white-translucent-20, rgba(255, 255, 255, 0.2));
  border-radius: var(--radius-xs, 4px);
  transition: background 0.2s ease;
}

.accounts-list::-webkit-scrollbar-thumb:hover {
  background: var(--white-translucent-30, rgba(255, 255, 255, 0.4));
}

.account-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: var(--white-translucent-5, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--border-translucent, rgba(255, 255, 255, 0.1));
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.account-item:hover {
  background: var(--primary-translucent-20, rgba(23, 93, 220, 0.2));
  border-color: var(--primary-accent, rgba(101, 171, 255, 0.5));
}

.account-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
  max-width: 200px;
}

.account-name-sub {
  font-size: var(--font-size-11, 11px);
  font-weight: 500;
  color: var(--text-muted, #8496b0);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-user {
  font-weight: 600;
  font-size: var(--font-size-13, 13px);
  color: var(--white, #f1f5f9);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-fill-small {
  background: var(--primary, #175ddc);
  color: var(--white, #f1f5f9);
  border: none;
  border-radius: var(--radius-xs, 4px);
  padding: 4px 10px;
  font-size: var(--font-size-12, 12px);
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.btn-fill-small:hover {
  background: var(--primary-hover, #0d43af);
}

.domain-subtext {
  font-size: var(--font-size-12, 12px);
  color: var(--text-muted, #8496b0);
  margin-top: 2px;
}

.actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 2px;
}

.btn {
  border: none;
  border-radius: var(--radius-sm, 6px);
  padding: 8px 16px;
  font-size: var(--font-size-13, 13px);
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.1s ease, background-color 0.15s ease, box-shadow 0.15s ease;
}

.btn:active {
  transform: scale(0.97);
}

.btn-primary {
  background: var(--primary, #175ddc);
  color: var(--white, #f1f5f9);
  box-shadow: 0 2px 6px var(--primary-translucent-20, rgba(23, 93, 220, 0.3));
  width: 100%;
}

.btn-primary:hover {
  background: var(--primary-hover, #0d43af);
  box-shadow: 0 4px 10px var(--primary-translucent-20, rgba(23, 93, 220, 0.4));
}

.progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  width: 100%;
  background: linear-gradient(90deg, var(--primary, #175ddc) 0%, var(--primary-accent, #65abff) 100%);
  transform-origin: left center;
  animation: gw-progress 5s linear forwards;
}

.progress-bar.paused {
  animation-play-state: paused;
}

@keyframes gw-progress {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}
`;

export function attachNotificationStyles(shadow: ShadowRoot): void {
  if (typeof CSSStyleSheet !== "undefined" && "adoptedStyleSheets" in shadow) {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(notificationToastCss);
    shadow.adoptedStyleSheets = [sheet];
  } else {
    const styleEl = document.createElement("style");
    styleEl.textContent = notificationToastCss;
    shadow.appendChild(styleEl);
  }
}
