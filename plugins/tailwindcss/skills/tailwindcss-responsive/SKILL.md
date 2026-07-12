---
name: tailwindcss-responsive
description: "Tailwind CSS v4 responsive breakpoints, mobile-first variants, custom @theme breakpoints, and container queries. Use when styles must respond to viewport or container width. Do NOT use for the underlying layout or sizing utilities."
---


# Responsive Design

## Default Breakpoints

| Variant | Size | CSS |
|---------|--------|-----|
| `sm:` | 40rem (640px) | `@media (width >= 40rem)` |
| `md:` | 48rem (768px) | `@media (width >= 48rem)` |
| `lg:` | 64rem (1024px) | `@media (width >= 64rem)` |
| `xl:` | 80rem (1280px) | `@media (width >= 80rem)` |
| `2xl:` | 96rem (1536px) | `@media (width >= 96rem)` |

## Custom breakpoint
```css
@theme {
  --breakpoint-3xl: 120rem;
}
/* Usage: 3xl:grid-cols-6 */
```

## Container Queries v4
```html
<div class="@container">
  <div class="@md:grid-cols-2 @lg:grid-cols-3">
    <!-- Responsive to container -->
  </div>
</div>
```

## Mobile-first
```html
<div class="text-sm md:text-base lg:text-lg">
  <!-- Small screens first -->
</div>
```
