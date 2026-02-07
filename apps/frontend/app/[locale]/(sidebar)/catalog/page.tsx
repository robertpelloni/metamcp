"use client";

import { useTranslations } from "@/hooks/useTranslations";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Search, ExternalLink, Download, Layers } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

export default function CatalogPage() {
  const { t } = useTranslations();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: catalogItems, isLoading } = trpc.frontend.catalog.list.useQuery();

  const categories = Array.from(new Set(catalogItems?.flatMap((item) => item.categories) || [])).sort();

  const filteredItems = catalogItems?.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory ? item.categories.includes(selectedCategory) : true;
    return matchesSearch && matchesCategory;
  });

  const handleCopyConfig = (item: any) => {
    // Generate a basic config snippet
    const config = {
      mcpServers: {
        [item.name.replace(/[^a-zA-Z0-9_]/g, "_")]: {
          url: item.url,
          // We don't know the command, so we just provide the URL as reference or suggest npx if it looks like a package
        }
      }
    };
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    toast.success("Config snippet copied to clipboard");
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center gap-3">
        <Layers className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold">MCP Catalog</h1>
          <p className="text-sm text-muted-foreground">
            Discover and install MCP servers from the community.
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search servers..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Sidebar Filters */}
        <div className="w-48 hidden md:block border-r pr-4">
            <h3 className="font-semibold mb-2 text-sm">Categories</h3>
            <ScrollArea className="h-[calc(100vh-250px)]">
                <div className="space-y-1">
                    <Button
                        variant={selectedCategory === null ? "secondary" : "ghost"}
                        className="w-full justify-start text-xs h-8"
                        onClick={() => setSelectedCategory(null)}
                    >
                        All
                    </Button>
                    {categories.map((cat) => (
                        <Button
                            key={cat}
                            variant={selectedCategory === cat ? "secondary" : "ghost"}
                            className="w-full justify-start text-xs h-8 truncate"
                            title={cat}
                            onClick={() => setSelectedCategory(cat)}
                        >
                            {cat}
                        </Button>
                    ))}
                </div>
            </ScrollArea>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto">
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-40 bg-muted/20 animate-pulse rounded-md" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
                    {filteredItems?.map((item) => (
                        <Card key={item.url} className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="text-base truncate" title={item.name}>{item.name}</CardTitle>
                                <CardDescription className="line-clamp-2 h-10 text-xs">
                                    {item.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="flex flex-wrap gap-1">
                                    {item.categories.slice(0, 3).map((cat: string) => (
                                        <Badge key={cat} variant="outline" className="text-[10px] px-1 py-0 h-5">
                                            {cat}
                                        </Badge>
                                    ))}
                                    {item.categories.length > 3 && (
                                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-5">
                                            +{item.categories.length - 3}
                                        </Badge>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between gap-2">
                                <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="mr-1 h-3 w-3" />
                                        View
                                    </a>
                                </Button>
                                <Button variant="secondary" size="sm" className="w-full text-xs" onClick={() => handleCopyConfig(item)}>
                                    <Download className="mr-1 h-3 w-3" />
                                    Config
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                    {filteredItems?.length === 0 && (
                        <div className="col-span-full text-center py-10 text-muted-foreground">
                            No servers found matching your criteria.
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
