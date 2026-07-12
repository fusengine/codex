# Elicit Profile

An optional `.codex/apex/elicit-profile.md` tunes technique selection without modifying the skill. Its absence keeps the default auto-detection matrix and catalog unchanged.

```markdown
# Elicit Profile

## Always Apply
- SEC-01
- ARCH-04

## Exclude
- UX-05

## Add for Code Type
| Code Type | Extra Techniques |
|-----------|------------------|
| Config/Docs/Plugin | DOC-04, MAINT-03 |
```

## Precedence

1. `Exclude` always removes matching techniques.
2. `Always Apply` adds techniques to every run.
3. `Add for Code Type` augments the matching matrix row.
4. If the same technique is both required and excluded, exclusion wins and the conflict is reported.

Create a profile only after repeated irrelevant findings or repeated missed categories demonstrate a repository-specific need.
