This is a Full Stack Web Application built with TanStack start, Tailwind CSS & vite+

## ReactRouting

- Create and edit forms for root entities (e.g. User, Animal, LeaveType) must live in dedicated routes (`new.tsx` for create, `$id.tsx` for edit), not modals on the list page.
- Don't wrap `Route.useLoaderData()` in `useState` if you never call the setter. Use the loader value directly: `const users = Route.useLoaderData();`. Only introduce state when the page actually mutates the list client-side (e.g. a "show archived" toggle that refetches into state).

