import { redirect } from "next/navigation";

export default async function DocsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Default to en/index if not sure, or try to find first page from nav?
  // For simplicity, assume index exists for the locale.
  redirect(`/docs/${locale}/index`);
}
