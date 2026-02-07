"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import Link from "next/link";
import React from "react";

// Helper to render icons dynamically
const Icon = ({ name, className }: { name: string; className?: string }) => {
  if (!name) return null;
  // Convert kebab-case to PascalCase for icon name
  const iconName = name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('') as keyof typeof LucideIcons;
  const IconComponent = (LucideIcons[iconName] || (LucideIcons as any)[name]) as React.ComponentType<{ className?: string }>;
  if (!IconComponent) return null;
  return <IconComponent className={className} />;
};

export const MdxCard = ({ title, icon, children, href, cols }: any) => {
  const content = (
    <Card className="h-full hover:bg-muted/50 transition-colors">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {icon && <Icon name={icon} className="h-5 w-5" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {children}
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href} className="block h-full">{content}</Link>;
  }
  return content;
};

export const MdxCardGroup = ({ children, cols = 2 }: any) => {
  return (
    <div className={cn("grid gap-4 mt-6", cols === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2")}>
      {children}
    </div>
  );
};

export const MdxCodeGroup = ({ children }: any) => {
    // Basic implementation: Render children in a container
    // A full implementation would parse children to find code blocks and create tabs
    // For now, let's just render them nicely
    return <div className="my-4 space-y-4 rounded-md border p-4 bg-muted/20">{children}</div>;
};

export const MdxAccordion = ({ icon, title, children }: any) => {
  return (
    <AccordionItem value={title || "accordion-item"}>
      <AccordionTrigger className="text-left">
        <div className="flex items-center gap-2">
            {icon && <Icon name={icon} className="h-4 w-4" />}
            {title}
        </div>
      </AccordionTrigger>
      <AccordionContent>{children}</AccordionContent>
    </AccordionItem>
  );
};

export const MdxAccordionGroup = ({ children }: any) => {
  return (
    <Accordion type="multiple" className="w-full my-6">
      {children}
    </Accordion>
  );
};

export const mdxComponents = {
  Card: MdxCard,
  CardGroup: MdxCardGroup,
  CodeGroup: MdxCodeGroup,
  Accordion: MdxAccordion,
  AccordionGroup: MdxAccordionGroup,
  img: (props: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} className={cn("rounded-lg border", props.className)} alt={props.alt || "Image"} />
  ),
};
