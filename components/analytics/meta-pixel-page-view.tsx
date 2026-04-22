"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackMetaPageView } from "@/lib/meta-pixel";

export default function MetaPixelPageView() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        trackMetaPageView();
    }, [pathname, searchParams]);

    return null;
}
