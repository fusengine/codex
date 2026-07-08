---
name: laravel-attributes
description: "Use when migrating Eloquent models, Jobs, Console commands, Controllers, API Resources, Validation, Factories or Seeders to native PHP 8.3 attributes introduced in Laravel 13. Covers all 7 categories of first-party attributes."
---


# Laravel 13 PHP Attributes

## Agent Workflow (MANDATORY)

Before ANY implementation, use the available Codex subagent capability when it materially helps. Suggested parallel checks:

1. **ai-pilot:exploration / explore-codebase** - Scan existing models/jobs/controllers for legacy `protected $fillable / $hidden / $connection` properties to convert
2. **ai-pilot:research / research-expert** - Verify Laravel 13 release notes for attribute coverage and edge cases
3. **mcp__context7__query-docs** - Pull authoritative examples from `laravel.com/docs/13.x`

After implementation, run **ai-pilot:sniper-check / sniper** for validation.

---

## Overview

| Category | Attributes |
|---------|-------------|
| **Eloquent** | `#[Table]` `#[Connection]` `#[Fillable]` `#[Hidden]` `#[Visible]` `#[Guarded]` `#[Unguarded]` `#[Appends]` `#[Touches]` |
| **Queue / Job** | `#[Connection]` `#[Queue]` `#[Tries]` `#[Timeout]` `#[Backoff]` `#[MaxExceptions]` `#[FailOnTimeout]` `#[UniqueFor]` |
| **Console** | `#[Signature]` `#[Description]` |
| **Controllers** | `#[Middleware]` `#[Authorize]` |
| **Validation** | `#[RedirectTo]` `#[StopOnFirstFailure]` |
| **API Resources** | `#[Collects]` `#[PreserveKeys]` |
| **Factories / Seeders** | `#[UseModel]` `#[Seed]` `#[Seeder]` |

---

## Critical Rules

1. **NEVER mix attributes and legacy properties** - `#[Fillable(['name'])]` + `protected $fillable = [...]` causes Laravel to ignore the attribute silently
2. **Class-level only** - All Eloquent / Job / Controller attributes apply to the class, never to private/protected methods
3. **Single source of truth** - Choose attributes OR properties per class; refactor in one pass to avoid drift
4. **Inheritance is additive** - Child class attributes merge with parent attributes; redeclare to override
5. **Import the right namespace** - `Illuminate\Database\Eloquent\Attributes\*` for Eloquent, `Illuminate\Queue\Attributes\*` for Jobs

---

## Architecture

```
app/
├── Models/
│   └── User.php              # #[Table] #[Fillable] #[Hidden] #[Appends]
├── Jobs/
│   └── ProcessPodcast.php    # #[Connection] #[Queue] #[Tries] #[Backoff]
├── Console/Commands/
│   └── SendEmails.php        # #[Signature] #[Description]
├── Http/
│   ├── Controllers/
│   │   └── PostController.php # #[Middleware] #[Authorize]
│   └── Resources/
│       └── PostCollection.php # #[Collects] #[PreserveKeys]
└── Http/Requests/
    └── StoreUserRequest.php   # #[RedirectTo] #[StopOnFirstFailure]
```

→ See [Model-with-attributes.php.md](references/templates/Model-with-attributes.php.md) for full example

---

## Reference Guide

| Topic | Reference | When to Consult |
|-------|-----------|-----------------|
| **Eloquent models** | [eloquent.md](references/eloquent.md) | Migrating `$fillable / $hidden / $table / $connection` |
| **Queue jobs** | [queue.md](references/queue.md) | Replacing `$tries / $timeout / $backoff` properties |
| **Console commands** | [console.md](references/console.md) | Refactoring `$signature / $description` properties |
| **Controllers** | [controllers.md](references/controllers.md) | Moving middleware/authorize from constructors |
| **Validation** | [validation.md](references/validation.md) | FormRequest redirect + early-stop config |
| **API Resources** | [api-resources.md](references/api-resources.md) | Collection wrapping and key preservation |
| **Factories / Seeders** | [factories-seeders.md](references/factories-seeders.md) | Model binding and seeder discovery |

### Templates

| Template | When to Use |
|----------|-------------|
| [Model-with-attributes.php.md](references/templates/Model-with-attributes.php.md) | Net new Eloquent model |
| [Job-with-attributes.php.md](references/templates/Job-with-attributes.php.md) | Net new queue Job |

---

## Quick Reference

### Eloquent model

```php
use Illuminate\Database\Eloquent\Attributes\{Table, Fillable, Hidden, Appends};

#[Table('flights')]
#[Fillable(['name', 'origin'])]
#[Hidden(['password'])]
#[Appends(['is_admin'])]
class Flight extends Model {}
```

### Queue job

```php
use Illuminate\Queue\Attributes\{Connection, Queue, Tries, Backoff};

#[Connection('redis')]
#[Queue('podcasts')]
#[Tries(5)]
#[Backoff([10, 30, 60])]
class ProcessPodcast implements ShouldQueue {}
```

→ See [Job-with-attributes.php.md](references/templates/Job-with-attributes.php.md) for complete example

---

## Best Practices

### DO
- Convert one class at a time and run tests between commits
- Keep attribute imports grouped at the top via PHP 8.1 grouped `use` syntax
- Use `#[Fillable]` for mass-assigned models and `#[Unguarded]` only on trusted internal models
- Combine `#[Connection]` + `#[Queue]` on Jobs to centralize routing intent

### DON'T
- Don't mix `#[Fillable(['x'])]` with `protected $fillable = ['y']` - the property silently wins on some setups, the attribute on others
- Don't place Eloquent/Job attributes on methods - they target the class only
- Don't put `#[Authorize]` on a controller without an underlying Policy registered in `AuthServiceProvider`
- Don't forget to drop the legacy `$tries`, `$backoff`, `$timeout` properties after adding the attributes - duplication is a red flag for code review
