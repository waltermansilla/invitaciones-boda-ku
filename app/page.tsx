import { redirect } from "next/navigation"

/**
 * Root page -- redirects to the default client.
 * In production, this could be a landing page for your brand.
 * For now it redirects to anto-walter as the first client.
 */
export default function Page() {
  redirect("/boda/anto-walter")
}
