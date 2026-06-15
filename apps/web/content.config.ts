import { defineCollection, defineContentConfig } from "@nuxt/content";

// Minimal default collection; question/schedule schemas added in the content-pipeline work.
export default defineContentConfig({
  collections: {
    content: defineCollection({
      type: "page",
      source: "**/*.md",
    }),
  },
});
