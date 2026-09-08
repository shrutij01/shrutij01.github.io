import type { APIRoute } from 'astro';

type PostFrontmatter = {
  title: string;
  slug: string;
  date: string;
  description: string;
};

const modules = import.meta.glob('../content/blog/*.mdx', { eager: true });

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export const GET: APIRoute = ({ site }) => {
  const baseUrl = site ?? new URL('https://shrutij01.github.io');
  const posts = Object.values(modules)
    .map((module) => (module as { frontmatter: PostFrontmatter }).frontmatter)
    .filter((post) => post?.slug)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const items = posts.map((post) => {
    const url = new URL(`/blog/${post.slug}`, baseUrl).href;
    return `
      <item>
        <title>${escapeXml(post.title)}</title>
        <link>${url}</link>
        <guid>${url}</guid>
        <pubDate>${new Date(post.date).toUTCString()}</pubDate>
        <description>${escapeXml(post.description)}</description>
      </item>`;
  }).join('');

  const feedUrl = new URL('/rss.xml', baseUrl).href;
  const homeUrl = new URL('/blog', baseUrl).href;
  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
      <channel>
        <title>Shruti Joshi — Research Explainers</title>
        <link>${homeUrl}</link>
        <description>Interactive, plain-language guides to the questions behind Shruti Joshi&apos;s research.</description>
        <language>en</language>
        <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />${items}
      </channel>
    </rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};
