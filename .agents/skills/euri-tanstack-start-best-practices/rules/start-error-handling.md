---
title: Route Error Handling
impact: MEDIUM
tags: errorComponent, route
---

## Route Error Handling

Handle errors in routes using the `errorComponent` prop. This ensures that the error is properly handled and displayed to the user.

**Example:**

```ts
// app/routes/users/$userId.tsx
export const Route = createFileRoute("/users/$userId")({
  loader: async ({ params }) => {
    const response = await fetch(`/api/users/${params.userId}`);
    if (!response.ok) {
      throw new Error("User not found");
    }
    return response.json();
  },
  errorComponent: ({ error }) => (
    <div>
      <h1>Error</h1>
      <p>{error.message}</p>
    </div>
  ),
  pendingComponent: () => <div>Loading...</div>,
  component: UserDetail,
});
```