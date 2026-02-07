import { getDocsNavigation } from "@/lib/docs";
import { DocsNav } from "@/components/docs/docs-nav";
import { ScrollArea } from "@/components/ui/scroll-area";

export default async function DocsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const navigation = getDocsNavigation();

  // Default to en if locale not found in docs
  const langConfig = navigation?.navigation?.languages?.find((l: any) => l.language === locale) ||
                     navigation?.navigation?.languages?.find((l: any) => l.language === "en");

  return (
    <div className="flex h-full">
      <div className="hidden md:block w-64 border-r bg-sidebar">
        <ScrollArea className="h-full py-6 px-4">
            {langConfig ? (
                <DocsNav groups={langConfig.groups} />
            ) : (
                <div className="text-sm text-muted-foreground p-4">Navigation not found</div>
            )}
        </ScrollArea>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="container max-w-4xl py-6 lg:py-10 px-8 mx-auto">
            {children}
        </div>
      </div>
    </div>
  );
}
