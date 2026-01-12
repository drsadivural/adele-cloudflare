import type { Config } from "drizzle-kit";

export default {
  schema: "./drizzle/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: "./.wrangler/state/v3/d1/miniflare-D1DatabaseObject/98c45dfa5a4e37d78dca9e60acc7ab3befe54db3c0cea3ddeb3b53ae3b6ecc30.sqlite",
  },
} satisfies Config;
