import type { ComponentProps } from "react";
import LandingPage from "@/components/landing/landing-page";
import landingData from "@/data/landing-1.json";

export default function LandingClassicPage() {
    return (
        <LandingPage
            data={
                landingData as ComponentProps<typeof LandingPage>["data"]
            }
        />
    );
}
