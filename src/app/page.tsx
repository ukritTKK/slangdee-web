import { redirect } from "next/navigation";
import { DEFAULT_LOCALE } from "@/constants/i18n";

export default function RootPage() {
  redirect(`/${DEFAULT_LOCALE}`);
}
