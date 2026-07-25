## State Management (React/Next.js)
Preserve existing libraries/architecture unless authorized; table below is a routing default, not a mandate.
Server(API)->TanStack Query `modules/[feature]/src/hooks/` · Global UI->Zustand `modules/cores/stores/` · Feature-shared->Zustand `modules/[feature]/src/stores/` · URL(Next.js)->App Router search params · URL(React/TanStack)->TanStack Router (route validators) · Form->TanStack Form (hooks/) · Local->`useState`.
Zustand: follow existing store locations; max 40 lines per store; prefer focused stores/selectors/colocated actions, split when hard to review.
FORBIDDEN: deep prop drilling, unbounded `useContext` store, `useEffect` for routine fetching, `useState` for shared state, stores hidden in components, subscribing to a whole store when a selector exists.
