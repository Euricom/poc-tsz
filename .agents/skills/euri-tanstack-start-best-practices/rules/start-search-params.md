---
title: Search Params Validation
impact: MEDIUM
tags: zod, route, search
---

## Search Params Validation

Validate search params using Zod. This ensures that the search params are valid and can be used to fetch data.

**Example:**

```ts
// app/routes/users/index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(10),
  search: z.string().optional(),
});

export const Route = createFileRoute("/users/")({
  validateSearch: searchSchema,
  loader: async ({ search }) => {
    const { page, limit, search: query } = search;
    // Fetch with pagination
    return fetchUsers({ page, limit, query });
  },
  component: Users,
});
```