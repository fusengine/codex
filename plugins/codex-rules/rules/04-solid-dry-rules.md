## SOLID Skill per Stack (read before coding)

| Agent | Skill | Interfaces |
|-------|-------|------------|
| nextjs-expert | `solid-nextjs/references/` | `modules/[feature]/src/interfaces/` |
| laravel-expert | `solid-php/references/` | `app/Contracts/` |
| swift-expert | `solid-swift/references/` | `Sources/Interfaces/` |
| react-expert | `solid-react/references/` | `modules/[feature]/src/interfaces/` |
| astro-expert | `solid-astro/references/` | `src/interfaces/` |
| other languages | `solid` plugin: `solid-detection` then `solid-{python,go,java,rust,ruby,csharp,generic}/references/` | per stack convention |

**Split by responsibility:** follow the active stack and repository conventions. Extract only when a file mixes responsibilities, becomes difficult to review, or creates reusable boundaries; never impose a universal filename set.

## DRY (ZERO TOLERANCE)

Before ANY new code: Grep codebase -> check shared locations -> extend/reuse if exists.

| Stack | Shared Locations |
|-------|------------------|
| Next.js/React | `modules/cores/lib/`, `modules/cores/components/`, `modules/cores/hooks/` |
| Laravel | `app/Services/`, `app/Actions/`, `app/Traits/`, `app/Contracts/` |
| Swift | `Core/Extensions/`, `Core/Utilities/`, `Core/Protocols/` |
