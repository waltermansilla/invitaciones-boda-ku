"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackGaPageView } from "@/lib/google-analytics";

export default function GoogleAnalyticsPageView() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        const query = searchParams.toString();
        const fullPath = query ? `${pathname}?${query}` : pathname;
        trackGaPageView(fullPath);
    }, [pathname, searchParams]);

    return null;
}
