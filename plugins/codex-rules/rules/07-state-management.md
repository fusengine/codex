## State Management (React / Next.js)

Preserve the libraries and architecture already present unless the user authorizes a migration. The table below is a routing default, not a mandate to introduce every library.

| State Type | Solution | Location |
|------------|----------|----------|
| Server (API) | TanStack Query | `modules/[feature]/src/hooks/` |
| Global UI | Zustand store | `modules/cores/stores/` |
| Feature shared | Zustand store | `modules/[feature]/src/stores/` |
| URL state (Next.js) | App Router search params | route/page boundary |
| URL state (React / TanStack) | TanStack Router when already used | route validators |
| Form state | TanStack Form | `modules/[feature]/src/hooks/` |
| Local only | `useState` | Inside component |

## Zustand Rules
- Follow existing feature/global store locations; use `modules/[feature]/src/stores/` and `modules/cores/stores/` only when the repository already follows that layout.
- Prefer focused stores, selectors, and colocated actions; split when responsibilities become difficult to review.

## FORBIDDEN
Deep prop drilling, `useContext` as an unbounded global store, `useEffect` for routine data fetching, `useState` for genuinely shared state, stores hidden in component files, subscribing to an entire store when a selector is available
