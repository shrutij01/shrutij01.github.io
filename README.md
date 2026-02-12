# Academic Portfolio Site

Personal research website built with [Astro](https://astro.build), React, Tailwind CSS, and MDX. Designed for AI researchers who also write code.

## Features

- **Dark mode** with system preference detection and manual toggle
- **Publications page** with tag filtering, expandable abstracts, and one-click BibTeX copy
- **Blog** with MDX, KaTeX math rendering, and syntax-highlighted code blocks
- **Interactive demos** (React components hydrated on demand — zero JS shipped on static pages)
- **Experience timeline** with visual design
- **Responsive** — works on mobile, tablet, desktop
- **Fast** — Astro ships zero JS by default; React only loads where needed

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:4321)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Customisation Checklist

1. **`src/components/Nav.astro`** — Change "Your Name" to your name
2. **`src/components/Footer.astro`** — Update social links
3. **`src/pages/index.astro`** — Edit bio, photo, news items, selected work
4. **`src/pages/research.astro`** — Replace research areas with yours
5. **`src/pages/experience.astro`** — Replace timeline entries
6. **`src/data/publications.ts`** — Add your publications with BibTeX
7. **`src/content/blog/`** — Add MDX blog posts
8. **`astro.config.mjs`** — Set your `site` URL (and `base` if using a repo subpath)
9. **`public/favicon.png`** — Replace with your own
10. **Add your photo** — Replace the placeholder in index.astro with `<img src="/photo.jpg" ...>`

## Adding a Publication

Edit `src/data/publications.ts`:

```typescript
{
  id: 'unique-id',
  title: 'Your Paper Title',
  authors: 'You, Collaborator A, Collaborator B',
  venue: 'NeurIPS',
  year: 2025,
  tags: ['topic-a', 'topic-b'],
  highlight: true,  // shows accent border
  links: [
    { label: 'Paper', href: 'https://...' },
    { label: 'Code', href: 'https://github.com/...' },
  ],
  bibtex: `@inproceedings{...}`,
  abstract: 'Optional abstract text.',
}
```

## Writing a Blog Post

Create `src/content/blog/your-post.mdx`:

```mdx
---
title: "Post Title"
slug: "post-title"
date: "2025-01-15"
description: "One-line description for the listing page."
tags: ["topic"]
---

Inline math: $E = mc^2$

Display math:

$$
\mathcal{L}(\theta) = \mathbb{E}_{p(\mathbf{z})}[\log p_\theta(\mathbf{x} | \mathbf{z})]
$$

Code with syntax highlighting:

\```python
import torch
model = torch.nn.Linear(10, 2)
\```
```

## Adding Interactive Demos

Create a React component in `src/components/YourDemo.tsx`, then use it in any Astro page:

```astro
---
import YourDemo from '../components/YourDemo';
---

<YourDemo client:load />
```

`client:load` hydrates immediately. Use `client:visible` to hydrate only when scrolled into view (better for heavy components).

## Deploy to GitHub Pages

1. Push to a GitHub repo
2. Go to **Settings → Pages → Source → GitHub Actions**
3. The workflow at `.github/workflows/deploy.yml` handles the rest
4. Set `site` in `astro.config.mjs` to `https://USERNAME.github.io`
5. If deploying to `USERNAME.github.io/REPO_NAME`, also uncomment and set `base`

## Project Structure

```
src/
├── components/
│   ├── Nav.astro              # Navigation + theme toggle
│   ├── Footer.astro           # Footer with social links
│   ├── PublicationList.tsx     # Interactive pub list (React)
│   └── RepresentationDemo.tsx  # Interactive demo (React)
├── content/
│   └── blog/                  # MDX blog posts
├── data/
│   └── publications.ts        # Publication entries
├── layouts/
│   └── BaseLayout.astro       # Base HTML layout
├── pages/
│   ├── index.astro            # Home
│   ├── research.astro         # Research interests
│   ├── publications.astro     # Publications (filterable)
│   ├── experience.astro       # Timeline
│   ├── demos.astro            # Interactive demos
│   └── blog/
│       ├── index.astro        # Blog listing
│       └── [slug].astro       # Individual post
└── styles/
    └── global.css             # Tailwind + custom styles
```

## Stack

- [Astro 5](https://astro.build) — static site generator
- [React 18](https://react.dev) — interactive components (hydrated on demand)
- [Tailwind CSS 3](https://tailwindcss.com) + [Typography plugin](https://tailwindcss.com/docs/typography-plugin)
- [MDX](https://mdxjs.com) — Markdown + JSX for blog posts
- [KaTeX](https://katex.org) — LaTeX math rendering via remark-math + rehype-katex
- [Shiki](https://shiki.style) — syntax highlighting (built into Astro)
