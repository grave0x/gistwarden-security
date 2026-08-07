import { type Component, createEffect, type JSX, For, Show } from "solid-js";
import { View } from "@gistwarden/domain";
import { navigate } from "@/core/navigation.ts";
import { t, type TranslationKey } from "@/core/i18n.ts";
import DetailHeader from "@/components/ui/DetailHeader.tsx";
import { DownloadIcon, SyncIcon } from "@/icons/svg/index.ts";

export interface ReportLayoutProps<T> {
  titleKey: TranslationKey;
  descKey: TranslationKey;
  itemCount?: number;
  items?: T[];
  isScanning?: boolean;
  progress?: number;
  scanButtonTextKey?: TranslationKey;
  scanButtonIcon?: JSX.Element;
  onStartScan?: () => void;
  errorMessage?: string | null;
  hasScanned?: boolean;
  cleanMsgKey: TranslationKey;
  cleanIcon?: JSX.Element;
  foundMsgKey?: TranslationKey;
  exportFileName?: string;
  renderExportRows?: (items: T[]) => string;
  renderItem?: (item: T, index: () => number) => JSX.Element;
  children?: JSX.Element;
}

export function ReportLayout<T>(props: ReportLayoutProps<T>): JSX.Element {
  const title = () => {
    const baseTitle = t(props.titleKey);
    if (props.itemCount !== undefined && props.itemCount > 0) {
      return `${baseTitle} (${props.itemCount})`;
    }
    return baseTitle;
  };

  const handleExportHtml = () => {
    if (!props.items || props.items.length === 0 || !props.renderExportRows) {
      return;
    }
    const results = props.items;
    const dateStr = new Date().toLocaleString();
    const rowsHtml = props.renderExportRows(results);

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t("report_export_title")}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 30px; margin: 0; }
    .container { max-width: 800px; margin: 0 auto; background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 20px; }
    .title { font-size: 20px; font-weight: bold; color: #38bdf8; margin: 0; }
    .meta { font-size: 12px; color: #94a3b8; }
    .summary { background-color: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; border-radius: 8px; padding: 12px 16px; color: #fca5a5; font-weight: bold; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { padding: 10px; border-bottom: 2px solid #334155; color: #94a3b8; font-size: 12px; text-transform: uppercase; }
    .footer { margin-top: 24px; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1 class="title">${t("report_export_heading")}</h1>
        <div class="meta">${t("report_export_meta")}</div>
      </div>
      <div class="meta">${dateStr}</div>
    </div>
    <div class="summary">
      ${t("report_export_summary").replace("{count}", results.length.toString())}
    </div>
    <table>
      <thead>
        <tr>
          <th>${t("report_export_col_account")}</th>
          <th>${t("report_export_col_username")}</th>
          <th>${t("report_export_col_exposure")}</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
    <div class="footer">
      ${t("report_export_footer")}
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = props.exportFileName || `Gistwarden_Report_${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div class="page-container report-detail-view">
      <DetailHeader title={title()} onBack={() => navigate(View.Reports)} />

      <p class="page-subtitle text-muted mt-2 mb-3">{t(props.descKey)}</p>

      {/* Action Button & Progress */}
      <Show when={props.onStartScan}>
        <div class="card p-3 mb-3">
          <button
            class="btn btn-primary w-100 flex-center gap-2"
            onClick={props.onStartScan}
            disabled={props.isScanning}
          >
            <Show when={props.isScanning} fallback={props.scanButtonIcon}>
              <SyncIcon class="spinning" />
            </Show>
            {props.isScanning
              ? t("report_scanning_progress").replace(
                  "{progress}",
                  (props.progress ?? 0).toString(),
                )
              : props.scanButtonTextKey
              ? t(props.scanButtonTextKey)
              : ""}
          </button>

          <Show when={props.isScanning}>
            <div class="progress-bar-container mt-3">
              <div
                class="progress-bar-fill"
                ref={(el) => {
                  createEffect(() => {
                    el.style.width = `${props.progress ?? 0}%`;
                  });
                }}
              />
            </div>
          </Show>
        </div>
      </Show>

      {/* Error Message */}
      <Show when={props.errorMessage}>
        <div class="alert alert-warning mb-3">{props.errorMessage}</div>
      </Show>

      {/* Custom Children Content */}
      {props.children}

      {/* Item List or Empty State */}
      <Show when={props.hasScanned ?? true}>
        <Show
          when={props.items && props.items.length > 0}
          fallback={
            <div class="empty-state text-center p-4 card mt-3">
              <Show when={props.cleanIcon}>
                <div class="empty-state-icon mb-2">{props.cleanIcon}</div>
              </Show>
              <p class="text-muted fw-medium">{t(props.cleanMsgKey)}</p>
            </div>
          }
        >
          <Show when={props.foundMsgKey}>
            <div class="alert alert-danger mb-2 w-100">
              {t(props.foundMsgKey!).replace(
                "{count}",
                (props.items?.length ?? 0).toString(),
              )}
            </div>
          </Show>

          <Show when={props.renderExportRows}>
            <div class="export-actions-row">
              <span class="text-muted text-sm fw-medium">
                {t(props.foundMsgKey || props.cleanMsgKey).replace(
                  "{count}",
                  (props.items?.length ?? 0).toString(),
                )}
              </span>
              <button
                class="btn btn-outline-primary btn-sm flex-align-center gap-1"
                onClick={handleExportHtml}
                title={t("report_export_btn")}
              >
                <DownloadIcon />
                {t("report_export_btn")}
              </button>
            </div>
          </Show>

          <Show when={props.renderItem}>
            <div class="item-list mt-2">
              <For each={props.items}>
                {(item, index) => props.renderItem!(item, index)}
              </For>
            </div>
          </Show>
        </Show>
      </Show>
    </div>
  );
}
