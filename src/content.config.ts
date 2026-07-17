import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projectLink = z.object({
  label: z.enum(['code', 'paper', 'demo', 'dataset', 'documentation']),
  url: z.url(),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    year: z.number().int(),
    status: z.enum(['active', 'completed', 'archived']),
    featured: z.boolean().default(false),
    draft: z.boolean().default(true),
    technologies: z.array(z.string()).default([]),
    role: z.string(),
    links: z.array(projectLink).default([]),
    image: z.string().optional(),
    relatedPublications: z.array(z.string()).default([]),
  }),
});

export const collections = { projects };
