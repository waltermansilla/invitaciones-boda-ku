"use client";

import configuradorEs from "@/data/landing/configurador-es.json";
import {
    PANEL_SHOWCASE_FAMILY,
    PANEL_SHOWCASE_FRAME,
    PANEL_SHOWCASE_MAIN,
    PANEL_SHOWCASE_NAMED_INVITE,
    PANEL_SHOWCASE_PDF_HEADER,
    PANEL_SHOWCASE_PDF_TABLE,
} from "@/lib/landing/panel-showcase-media";

const t = configuradorEs.ui;

type Variant = "light" | "dark";

function frameClass(variant: Variant) {
    return variant === "dark"
        ? "overflow-hidden rounded-lg border border-white/15 shadow-sm"
        : "overflow-hidden rounded-lg border border-[#E1D7C9] shadow-[0_1px_2px_rgba(63,51,43,0.06)]";
}

function titleClass(variant: Variant) {
    return variant === "dark"
        ? "text-sm font-semibold leading-snug text-white/90"
        : "text-[13px] font-semibold leading-snug text-[#5A4A3F]";
}

function bodyClass(variant: Variant) {
    return variant === "dark"
        ? "mt-1 text-xs leading-relaxed text-white/70"
        : "mt-1 text-[11px] leading-relaxed text-[#6A5C52] sm:text-xs";
}

function leadClass(variant: Variant) {
    return variant === "dark"
        ? "text-sm leading-relaxed text-white/80"
        : "text-sm leading-relaxed text-[#6A5C52]";
}

function centerTitleClass(variant: Variant) {
    return variant === "dark"
        ? "text-center text-sm font-semibold leading-snug text-white/90"
        : "text-center text-[13px] font-semibold leading-snug text-[#5A4A3F]";
}

export function PanelShowcaseContent({
    variant = "light",
    showLead = true,
    mainImagePlain = false,
    spacious = false,
}: {
    variant?: Variant;
    /** Texto intro del paso panel del configurador. */
    showLead?: boolean;
    /** Sin borde/recorte: PNG transparente (p. ej. modal base). */
    mainImagePlain?: boolean;
    /** Más ancho para modal base (retratos y PDF). */
    spacious?: boolean;
}) {
    const { portrait, mainPlain, family } = PANEL_SHOWCASE_FRAME;
    const portraitW = spacious ? Math.round(portrait.width * 1.15) : portrait.width;
    const portraitH = spacious ? Math.round(portrait.height * 1.15) : portrait.height;
    const familyW = spacious ? family.width : Math.round(family.width * 0.88);
    const familyHeight = Math.round((familyW * 1024) / 824);
    const mainColW = mainImagePlain ? mainPlain.width : portraitW;
    const mainColH = mainImagePlain ? mainPlain.height : portraitH;
    const sidePortraitW = portraitW;
    const sidePortraitH = portraitH;

    return (
        <div className="space-y-5 pb-1">
            {showLead ? <p className={leadClass(variant)}>{t.panelLead}</p> : null}

            <div className="flex flex-row items-start gap-3">
                {mainImagePlain ? (
                    <div
                        className="shrink-0 overflow-hidden"
                        style={{ width: mainColW, height: mainColH }}
                    >
                        {/* panel.PNG trae el mockup centrado en lienzo ancho: cover + crop como configurador */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={PANEL_SHOWCASE_MAIN.src}
                            alt={PANEL_SHOWCASE_MAIN.alt}
                            className="block h-full w-full object-cover object-top"
                            style={{ objectPosition: "26% top" }}
                            decoding="async"
                        />
                    </div>
                ) : (
                    <div
                        className={frameClass(variant)}
                        style={{ width: mainColW, height: mainColH }}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={PANEL_SHOWCASE_MAIN.src}
                            alt={PANEL_SHOWCASE_MAIN.alt}
                            className="block h-full w-full object-cover object-top"
                            decoding="async"
                        />
                    </div>
                )}
                <div className="min-w-0 flex-1 pt-0.5">
                    <p className={titleClass(variant)}>{t.panelImg1Summary}</p>
                    {t.panelImg1Body ? (
                        <p className={bodyClass(variant)}>{t.panelImg1Body}</p>
                    ) : null}
                </div>
            </div>

            <div className="flex flex-row items-start gap-3">
                <div className="min-w-0 flex-1 pt-0.5 text-right">
                    <p className={titleClass(variant)}>{t.panelImg2Summary}</p>
                    <p className={bodyClass(variant)}>{t.panelImg2Body}</p>
                </div>
                <div
                    className={`${frameClass(variant)} shrink-0`}
                    style={{ width: sidePortraitW, height: sidePortraitH }}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={PANEL_SHOWCASE_NAMED_INVITE.src}
                        alt={PANEL_SHOWCASE_NAMED_INVITE.alt}
                        className="block h-full w-full object-cover object-top"
                        decoding="async"
                    />
                </div>
            </div>

            <div className="flex flex-row items-start gap-3">
                <div
                    className={`${frameClass(variant)} shrink-0`}
                    style={{ width: familyW, height: familyHeight }}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={PANEL_SHOWCASE_FAMILY.src}
                        alt={PANEL_SHOWCASE_FAMILY.alt}
                        className="block h-full w-full scale-110 object-cover object-center"
                        decoding="async"
                    />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                    <p className={titleClass(variant)}>{t.panelImg3Summary}</p>
                    <p className={bodyClass(variant)}>{t.panelImg3Body}</p>
                </div>
            </div>

            <div className="flex flex-col items-center gap-2">
                <p className={`max-w-md ${centerTitleClass(variant)}`}>
                    {t.panelImg4Summary}
                </p>
                <div className="flex w-full max-w-[min(380px,100%)] flex-col items-center gap-2">
                    <div
                        className={`w-[78%] ${frameClass(variant)}`}
                        style={{ aspectRatio: "868 / 370" }}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={PANEL_SHOWCASE_PDF_HEADER.src}
                            alt={PANEL_SHOWCASE_PDF_HEADER.alt}
                            className="block h-full w-full object-cover object-center"
                            decoding="async"
                        />
                    </div>
                    <div className={`w-full ${frameClass(variant)}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={PANEL_SHOWCASE_PDF_TABLE.src}
                            alt={PANEL_SHOWCASE_PDF_TABLE.alt}
                            className="block h-auto w-full"
                            decoding="async"
                        />
                    </div>
                </div>
                <p className={`max-w-md text-center ${bodyClass(variant)}`}>
                    {t.panelImg4Body}
                </p>
            </div>
        </div>
    );
}
