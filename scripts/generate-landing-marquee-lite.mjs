#!/usr/bin/env node
/**
 * Genera WebP en public/landing/media/images-marquee-lite/ a partir de
 * `pageLayout.heroMarqueeLiteSrcs` en data/landing/landing-2.json (rutas .webp esperadas).
 * Para cada nombre base busca el original en public/landing/media/images/ (.jpg/.jpeg/.png).
 * Si falta heroMarqueeLiteSrcs, usa fallback estilos + overlays (mantener sync manual).
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const LANDING_JSON = path.join(ROOT, "data/landing/landing-2.json");
const IMAGES_DIR = path.join(ROOT, "public/landing/media/images");
const OUT_DIR = path.join(ROOT, "public/landing/media/images-marquee-lite");

const FALLBACK_OVERLAYS = [
    "/landing/media/images/yesica-hernan-boda-overlay.jpeg",
    "/landing/media/images/mirta-pelu-boda-overlay.jpeg",
    "/landing/media/images/overlay-diseño.jpg",
];

function isExcludedHeroMarqueeFile(file) {
    return /^panel\./i.test(file);
}

function toInputPath(src) {
    const t = src.trim();
    const prefix = "/landing/media/images/";
    if (!t.startsWith(prefix)) return null;
    return path.join(IMAGES_DIR, t.slice(prefix.length));
}

function panelFilterSrc(src) {
    const file = path.basename(src);
    return !isExcludedHeroMarqueeFile(file);
}

/** `…/images-marquee-lite/stem.webp` → stem */
function stemFromLitePublicUrl(url) {
    const t = String(url).trim();
    const m = t.match(/\/images-marquee-lite\/([^/]+)\.webp$/i);
    return m ? m[1] : null;
}

async function resolveSourceFromStem(stem) {
    const exts = [".jpg", ".jpeg", ".png", ".JPG", ".JPEG", ".PNG"];
    for (const ext of exts) {
        const p = path.join(IMAGES_DIR, stem + ext);
        try {
            await fs.access(p);
            return p;
        } catch {
            /* */
        }
    }
    return null;
}

async function main() {
    const raw = await fs.readFile(LANDING_JSON, "utf8");
    const data = JSON.parse(raw);

    const liteUrls = data?.pageLayout?.heroMarqueeLiteSrcs;
    /** @type {{ stem: string }[]} */
    let jobs = [];

    if (Array.isArray(liteUrls) && liteUrls.length > 0) {
        const seen = new Set();
        for (const url of liteUrls) {
            const stem = stemFromLitePublicUrl(url);
            if (!stem) {
                console.warn(
                    "omitido (esperado …/images-marquee-lite/NOMBRE.webp):",
                    url,
                );
                continue;
            }
            if (seen.has(stem)) continue;
            seen.add(stem);
            jobs.push({ stem });
        }
    } else {
        const items = data?.sections?.estilos?.items ?? [];
        const fromItems = items.map((it) => it.image?.trim()).filter(Boolean);
        const merged = [
            ...new Set([...fromItems, ...FALLBACK_OVERLAYS]),
        ].filter(panelFilterSrc);
        for (const src of merged) {
            const inPath = toInputPath(src);
            if (!inPath) continue;
            try {
                await fs.access(inPath);
            } catch {
                continue;
            }
            const stem = path.basename(inPath, path.extname(inPath));
            jobs.push({ stem });
        }
    }

    await fs.mkdir(OUT_DIR, { recursive: true });

    let ok = 0;
    for (const { stem } of jobs) {
        if (isExcludedHeroMarqueeFile(stem + ".webp")) continue;
        const inPath = await resolveSourceFromStem(stem);
        if (!inPath) {
            console.error("falta origen en images/ para stem:", stem);
            process.exitCode = 1;
            continue;
        }
        const outPath = path.join(OUT_DIR, `${stem}.webp`);
        await sharp(inPath)
            .rotate()
            .resize({
                width: 240,
                withoutEnlargement: true,
            })
            .webp({ quality: 76, effort: 4 })
            .toFile(outPath);
        console.log("ok", path.relative(ROOT, outPath));
        ok++;
    }
    console.log(`Listo: ${ok} archivo(s).`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
