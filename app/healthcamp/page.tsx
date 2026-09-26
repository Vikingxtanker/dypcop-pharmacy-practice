import { redirect } from "next/navigation";

/**
 * Legacy short link for the health camp. Kept as a live route because printed
 * handouts, QR codes and WhatsApp forwards already point at /healthcamp; it
 * sends visitors straight to the home page instead of 404ing.
 *
 * `redirect` throws during render, so this component never returns markup and
 * the response is a 307 issued before anything is painted. `replace` (the
 * default here) also keeps the legacy URL out of the history stack, so the
 * visitor's Back button does not bounce them into a redirect loop.
 */
export default function HealthCampPage() {
  redirect("/");
}
