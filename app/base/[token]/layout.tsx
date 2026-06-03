import { findConfigByBaseToken } from "@/lib/config-loader";
import { getBaseModalPrimaryButtonColors } from "@/lib/color-contrast";

interface LayoutProps {
    children: React.ReactNode;
    params: Promise<{ token: string }>;
}

export default async function BaseTokenLayout({
    children,
    params,
}: LayoutProps) {
    const { token } = await params;
    const config = findConfigByBaseToken(token);
    const primaryColorRaw = (
        config?.theme as Record<string, unknown> | undefined
    )?.primaryColor;
    const primaryColor =
        typeof primaryColorRaw === "string" && primaryColorRaw.trim()
            ? primaryColorRaw.trim()
            : "#111111";
    const modalPrimaryBtn = getBaseModalPrimaryButtonColors(primaryColor);
    return (
        <>
            <style
                dangerouslySetInnerHTML={{
                    __html: `
            html, body {
              min-height: 100%;
              background-color: ${primaryColor} !important;
              background-image: linear-gradient(160deg, ${primaryColor} 0%, #1d1b1a 55%, #111111 100%) !important;
              background-attachment: fixed !important;
              background-repeat: no-repeat !important;
              background-size: 100% 100% !important;
            }
            html, body {
              color-scheme: dark !important;
            }
            :root {
              --base-primary-color: ${primaryColor};
              --base-modal-primary-bg: ${modalPrimaryBtn.background};
              --base-modal-primary-fg: ${modalPrimaryBtn.foreground};
              --base-modal-bg: #1f1f1f;
              --base-modal-surface: #2a2a2a;
              --base-modal-border: rgba(255, 255, 255, 0.18);
              --background: #1f1f1f;
              --popover: #1f1f1f;
              --card: #1f1f1f;
              --foreground: #ffffff;
              --muted-foreground: rgba(255, 255, 255, 0.75);
              --border: rgba(255, 255, 255, 0.18);
            }
            [data-slot="dialog-content"].base-wa-modal,
            [data-slot="dialog-content"].base-panel-modal {
              background-color: var(--base-modal-bg) !important;
              border-color: var(--base-modal-border) !important;
              color: #ffffff !important;
            }
            [data-slot="dialog-content"].base-panel-modal,
            .base-panel-modal-footer {
              background-color: var(--base-modal-bg) !important;
            }
            .base-panel-modal-footer {
              border-top-color: rgba(255, 255, 255, 0.15) !important;
            }
            [data-slot="dialog-content"].base-wa-modal textarea {
              background-color: var(--base-modal-surface) !important;
              border-color: var(--base-modal-border) !important;
              color: #ffffff !important;
            }
            [data-slot="dialog-content"] button.base-modal-primary-btn {
              background-color: var(--base-modal-primary-bg) !important;
              color: var(--base-modal-primary-fg) !important;
              -webkit-text-fill-color: var(--base-modal-primary-fg) !important;
            }
            [data-slot="dialog-content"] .base-modal-secondary-btn {
              border-color: rgba(255, 255, 255, 0.25) !important;
              background-color: transparent !important;
              color: #ffffff !important;
              -webkit-text-fill-color: #ffffff !important;
            }
            [data-slot="dialog-content"].base-panel-modal {
              padding: 0.875rem !important;
              display: flex !important;
              flex-direction: column !important;
              grid-template-columns: unset !important;
              grid-template-rows: unset !important;
              left: 1rem !important;
              right: 1rem !important;
              top: max(0.375rem, env(safe-area-inset-top)) !important;
              bottom: max(0.375rem, env(safe-area-inset-bottom)) !important;
              width: auto !important;
              max-width: min(28rem, calc(100% - 2rem)) !important;
              margin-left: auto !important;
              margin-right: auto !important;
              height: auto !important;
              max-height: none !important;
              transform: none !important;
              translate: none !important;
              --tw-enter-scale: 1;
              --tw-exit-scale: 1;
              --tw-enter-translate-x: 0;
              --tw-enter-translate-y: 0;
              --tw-exit-translate-x: 0;
              --tw-exit-translate-y: 0;
              overflow: hidden !important;
            }
            [data-slot="base-panel-modal-scroll"] {
              flex: 1 1 0 !important;
              height: 0 !important;
              min-height: 0 !important;
              padding-left: 0.75rem !important;
              padding-right: 0.75rem !important;
              overflow-x: hidden !important;
              overflow-y: scroll !important;
              -webkit-overflow-scrolling: touch !important;
              touch-action: pan-y !important;
              overscroll-behavior: contain;
            }
            .base-panel-modal-thumb-wrap {
              display: flex !important;
              justify-content: center !important;
              width: 100% !important;
            }
            img.base-panel-modal-thumb {
              display: block !important;
              width: 100% !important;
              max-width: 100% !important;
              height: auto !important;
              max-height: 400px !important;
              margin-left: auto !important;
              margin-right: auto !important;
              object-fit: contain !important;
              object-position: center center !important;
            }
            [data-slot="dialog-overlay"] {
              background-color: rgba(0, 0, 0, 0.72) !important;
            }
          `,
                }}
            />
            {children}
        </>
    );
}
