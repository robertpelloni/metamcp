import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";

import { mdxComponents } from "@/components/docs/mdx-components";
import { getDoc } from "@/lib/docs";

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const doc = getDoc(slug);

  if (!doc) {
    notFound();
  }

  return (
    <article className="prose prose-zinc dark:prose-invert max-w-none">
      <h1>{doc.title}</h1>
      {doc.description && (
        <p className="text-xl text-muted-foreground">{doc.description}</p>
      )}
      <hr className="my-6" />
      <MDXRemote
        source={doc.content}
        components={mdxComponents}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
          },
        }}
      />
    </article>
  );
}
