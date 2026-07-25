## SOLID & DRY per Stack
Before new code: grep + check shared locations below; reuse if it exists. Split only when a file mixes concerns or is hard to review.
`nextjs-expert` -> `solid-nextjs/references/`, interfaces `modules/[feature]/src/interfaces/`, shared `modules/cores/{lib,components,hooks}/`
`react-expert` -> `solid-react/references/`, interfaces `modules/[feature]/src/interfaces/`, shared `modules/cores/{lib,components,hooks}/`
`laravel-expert` -> `solid-php/references/`, interfaces `app/Contracts/`, shared `app/{Services,Actions,Traits,Contracts}/`
`swift-expert` -> `solid-swift/references/`, interfaces `Sources/Interfaces/`, shared `Core/{Extensions,Utilities,Protocols}/`
`astro-expert` -> `solid-astro/references/`, interfaces `src/interfaces/`
other languages -> `solid` plugin: `solid-detection` then `solid-{python,go,java,rust,ruby,csharp,generic}/references/`, per stack convention
