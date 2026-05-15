---
name: laravel-queues
description: Laravel 13 background jobs - PHP Attributes (#[Queue], #[Connection], #[Tries], #[Backoff]), workers, batches, chains, middleware, Queue::route() centralised routing. Use for async tasks.
---


# Laravel Queues (L13 — Attributes-first)

## Agent Workflow (MANDATORY)

Before ANY implementation, use `TeamCreate` to spawn 3 agents:

1. **fuse-ai-pilot:explore-codebase** - Audit job classes, connections, queue routes
2. **fuse-ai-pilot:research-expert** - Verify L13 Queue + Queue::route() via Context7
3. **mcp__context7__query-docs** - Check queue attribute patterns

After implementation, run **fuse-ai-pilot:sniper** for validation.

---

## Overview

Laravel 13 introduces **PHP Attributes** on Queueables (Jobs, Listeners, Notifications, Mailables, Broadcast Events) as the primary configuration mechanism. Centralised routing is configured via `Queue::route()` in `AppServiceProvider::boot()`.

| Attribute (L13 MAIN) | Legacy property |
|----------------------|-----------------|
| `#[Connection('redis')]` · `#[Queue('podcasts')]` | `public $connection` · `public $queue` |
| `#[Tries(5)]` · `#[Timeout(120)]` · `#[MaxExceptions(3)]` | `public int $tries / $timeout / $maxExceptions` |
| `#[Backoff([10, 30, 60])]` · `#[FailOnTimeout]` | `public $backoff` · `public bool $failOnTimeout` |
| `#[UniqueFor(3600)]` · `#[AfterCommit]` · `#[DeleteWhenMissingModels]` | `public $uniqueFor / $afterCommit / $deleteWhenMissingModels` |

> Applies to **Jobs, Listeners, Notifications, Mailables, and Broadcast Events**.

---

## Critical Rules

1. **Declare queue metadata with Attributes** - `#[Queue]`, `#[Tries]`, `#[Backoff]`
2. **Centralise routing with `Queue::route()`** in `AppServiceProvider::boot()`
3. **Implement `failed(Throwable $e)`** for every production job
4. **Use `#[AfterCommit]`** when dispatching inside DB transactions
5. **Monitor Redis queues with Horizon** in production

---

## Architecture

```
app/
├── Jobs/
│   └── ProcessPodcast.php       # #[Connection, Queue, Tries, Backoff]
├── Providers/
│   └── AppServiceProvider.php   # Queue::route('podcasts', 'redis')
└── Listeners/
    └── SendShipmentNotification.php  # #[Queue('mail')]
```

→ See [templates/QueueableJob.php.md](references/templates/QueueableJob.php.md)

---

## Reference Guide

### Concepts

- **Migration L12→L13:** [legacy-properties.md](references/legacy-properties.md)
- **Jobs lifecycle:** [jobs.md](references/jobs.md) · [dispatching.md](references/dispatching.md) · [workers.md](references/workers.md)
- **Composition:** [batching.md](references/batching.md) · [chaining.md](references/chaining.md) · [middleware.md](references/middleware.md)
- **Reliability:** [failed-jobs.md](references/failed-jobs.md) · [horizon.md](references/horizon.md) · [testing.md](references/testing.md) · [troubleshooting.md](references/troubleshooting.md)

### Templates

| Template | When to Use |
|----------|-------------|
| [QueueableJob.php.md](references/templates/QueueableJob.php.md) | Attribute-based job |
| [BatchJob.php.md](references/templates/BatchJob.php.md) | Batchable job |
| [ChainedJobs.php.md](references/templates/ChainedJobs.php.md) | Job chain |
| [JobMiddleware.php.md](references/templates/JobMiddleware.php.md) | Custom middleware |
| [JobTest.php.md](references/templates/JobTest.php.md) | Job test |

---

## Quick Reference

### Attribute-based Job (L13 MAIN)

```php
use Illuminate\Queue\Attributes\{Connection, Queue, Tries, Timeout, Backoff, MaxExceptions, FailOnTimeout, UniqueFor};
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

#[Connection('redis')]
#[Queue('podcasts')]
#[Tries(5)]
#[Timeout(120)]
#[Backoff([10, 30, 60])]
#[MaxExceptions(3)]
#[FailOnTimeout]
#[UniqueFor(3600)]
final class ProcessPodcast implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly Podcast $podcast) {}

    public function handle(PodcastService $service): void { $service->process($this->podcast); }

    public function failed(\Throwable $e): void { Log::error('Podcast failed', ['id' => $this->podcast->id, 'e' => $e]); }
}
```

### Queue Routing (centralised)

```php
// app/Providers/AppServiceProvider.php
use Illuminate\Support\Facades\Queue;

public function boot(): void
{
    Queue::route('podcasts', connection: 'redis', queue: 'media');
    Queue::route('mail',     connection: 'redis', queue: 'transactional');
}
```

→ Legacy `public int $tries = 5` style — see [legacy-properties.md](references/legacy-properties.md)

---

## Best Practices

### DO
- Use **Attributes** on Jobs, Listeners, Notifications, Mailables, Broadcast Events
- Centralise routing via `Queue::route()` in `AppServiceProvider::boot()`
- Use `#[AfterCommit]` when dispatching inside a transaction
- `final` job classes, implement `failed()`, monitor Redis with Horizon

### DON'T
- Mix `#[Tries]` and `public int $tries` (single source of truth)
- Dispatch in a transaction without `#[AfterCommit]`
- Store large objects/closures in job constructor properties
- Use `sync` driver in production
