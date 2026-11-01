import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { jurisdictionSchema } from "./lib/schema";

/**
 * The schema lives in lib/schema.ts because the contribution form and the
 * submit Worker validate against the same object. See that file for the rules.
 */
const jurisdictions = defineCollection({
	loader: glob({ pattern: "**/*.json", base: "./src/content/jurisdictions" }),
	schema: jurisdictionSchema,
});

export const collections = { jurisdictions };
