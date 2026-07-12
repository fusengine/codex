---
name: go-concurrency
description: "Use when: writing or reviewing Go concurrency — goroutines, channels, golang.org/x/sync/errgroup, context propagation and cancellation, sync.WaitGroup vs channels, the -race detector, or diagnosing goroutine leaks (incl. the 1.26 goroutineleak profile). Do NOT use for: sequential error handling / slog / generics / interface style (use go-core-idioms), non-Go languages, framework-specific code."
---

# Go Concurrency

Goroutines, channels, `context`, and `errgroup` for Go 1.26 — plus the number-one
documented pitfall: **leaking goroutines on an unbuffered channel + early return.**

## Codex Workflow (MANDATORY)

Before implementation, inspect local goroutine/channel/context usage first.
Use available Codex subagents when the task is broad or risky:

1. **ai-pilot:exploration / explore-codebase** - Map existing goroutine/channel/context usage
2. **ai-pilot:research / research-expert** - Verify errgroup/context docs via Context7/Exa/fuse-browser
3. **Context7** - Confirm `golang.org/x/sync/errgroup` signatures

After implementation, run **ai-pilot:sniper-check / sniper** for validation when available, and run tests
with `go test -race ./...`.

---

## Overview

| Feature | Description |
|---------|-------------|
| **Goroutines & channels** | Lightweight concurrency + typed communication |
| **errgroup** | Parallelism + error aggregation + context cancellation |
| **context** | First param, propagated strictly, carries cancellation/deadline |
| **WaitGroup vs channels** | Counting-only vs result/error passing |
| **Race detector** | `-race` in tests/CI to catch data races |
| **Leak profile (1.26)** | `GOEXPERIMENT=goroutineleakprofile` / `/debug/pprof/goroutineleak` |

---

## Critical Rules

1. **`context.Context` is the first parameter** - named `ctx`, never stored in a struct
2. **Every started goroutine must be able to exit** - or it leaks (see rule 4)
3. **Prefer `errgroup` for fan-out with errors** - it handles wait + first error + cancel
4. **Unbuffered channel + early return = leak** - senders block forever; buffer or drain
5. **Test with `-race`** - a passing test without `-race` proves nothing about races

---

## Architecture

```
internal/
├── fetch/
│   ├── fetch.go        # errgroup.WithContext fan-out, bounded by SetLimit
│   └── worker.go       # worker pool: fixed goroutines drain a jobs channel
└── pipeline/
    └── stage.go        # ctx-cancellable stages, buffered hand-off channels
```

→ See [errgroup-patterns.md](references/templates/errgroup-patterns.md) for full example

---

## Reference Guide

### Concepts

| Topic | Reference | When to Consult |
|-------|-----------|-----------------|
| **Goroutines & channels** | [goroutines-channels.md](references/goroutines-channels.md) | Buffered vs not, select, WaitGroup vs channels |
| **errgroup** | [errgroup.md](references/errgroup.md) | Fan-out, error aggregation, SetLimit, TryGo |
| **context** | [context-propagation.md](references/context-propagation.md) | Cancellation, deadlines, propagation rules |
| **Goroutine leaks** | [goroutine-leaks.md](references/goroutine-leaks.md) | The #1 pitfall + the 1.26 leak profile |

### Templates

| Template | When to Use |
|----------|-------------|
| [errgroup-patterns.md](references/templates/errgroup-patterns.md) | Bounded parallel work with error handling |
| [worker-pool.md](references/templates/worker-pool.md) | Fixed workers draining a job queue |

---

## Quick Reference

### Parallel work with errgroup

```go
g, ctx := errgroup.WithContext(ctx)
g.SetLimit(8) // bound concurrency
for _, u := range urls {
    g.Go(func() error { return fetch(ctx, u) })
}
if err := g.Wait(); err != nil { // first non-nil error; cancels ctx
    return err
}
```

→ See [errgroup.md](references/errgroup.md)

### Avoid the leak (buffer so senders never block)

```go
ch := make(chan result, len(items)) // buffered → early return can't strand senders
```

→ See [goroutine-leaks.md](references/goroutine-leaks.md)

---

## Best Practices

### DO
- Pass `ctx` first and thread it through every blocking call
- Reach for `errgroup` before hand-rolling `WaitGroup` + error channels
- Buffer result channels to the number of senders, or fully drain them
- Run `go test -race`; try `GOEXPERIMENT=goroutineleakprofile` in CI (1.26)

### DON'T
- Return early from a fan-out while goroutines still block on an unbuffered channel
- Store a `context.Context` in a struct field
- Use a bare `sync.WaitGroup` when goroutines return errors (use `errgroup`)
- Assume tests are race-free without the `-race` flag

## References

- [references/goroutines-channels.md](references/goroutines-channels.md)
- [references/errgroup.md](references/errgroup.md)
- [references/context-propagation.md](references/context-propagation.md)
- [references/goroutine-leaks.md](references/goroutine-leaks.md)
- [references/templates/errgroup-patterns.md](references/templates/errgroup-patterns.md)
- [references/templates/worker-pool.md](references/templates/worker-pool.md)

## Related skills

`go-core-idioms`, `solid:solid-go`.

## Skill routing metadata

references: references/goroutines-channels.md, references/errgroup.md, references/context-propagation.md, references/goroutine-leaks.md, references/templates/errgroup-patterns.md, references/templates/worker-pool.md
related-skills: go-core-idioms, solid:solid-go
