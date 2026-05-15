import { redirect } from "next/navigation";

/** Campañas antiguas: misma landing en inglés con USD por defecto. */
export default function LandingIntlRedirectPage() {
    redirect("/en?currency=USD");
}
