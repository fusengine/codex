---
name: laravel-billing
description: "Integrate Stripe and Paddle payments with Laravel Cashier. Use when implementing subscriptions, invoices, payment methods, webhooks, or billing portals."
---


# Laravel Billing (Cashier)

## Agent Workflow (MANDATORY)

Before ANY implementation, use the available Codex subagent capability when it materially helps. Suggested parallel checks:

1. **ai-pilot:exploration / explore-codebase** - Check existing billing setup, User model
2. **ai-pilot:research / research-expert** - Verify latest Cashier docs via Context7
3. **mcp__context7__query-docs** - Query specific patterns (Stripe/Paddle)

After implementation, run **ai-pilot:sniper-check / sniper** for validation.

---

## Overview

Laravel Cashier provides subscription billing with Stripe or Paddle. Choose based on your needs:

| Provider | Package | Best For |
|----------|---------|----------|
| **Stripe** | `laravel/cashier` | Full control, high volume, complex billing |
| **Paddle** | `laravel/cashier-paddle` | Tax handling, compliance, global sales |

### Key Difference: MoR vs Payment Processor

| Aspect | Stripe | Paddle |
|--------|--------|--------|
| **Type** | Payment Processor | Merchant of Record |
| **Taxes** | You manage (or Stripe Tax) | Paddle manages automatically |
| **Invoices** | Your company name | Paddle + your name |
| **Compliance** | Your responsibility | Paddle handles |
| **Fees** | ~2.9% + $0.30 | ~5% + $0.50 (all-inclusive) |

---

## Critical Rules

1. **Use webhooks** - Never rely on client-side confirmations
2. **Handle grace periods** - Allow access until subscription ends
3. **Never store card details** - Use payment tokens/methods
4. **Test with test keys** - Always before production
5. **Verify webhook signatures** - Prevent spoofing attacks
6. **Handle incomplete payments** - 3D Secure requires user action

---

## Architecture

```
app/
├── Http/
│   ├── Controllers/
│   │   └── Billing/              ← Billing controllers
│   │       ├── SubscriptionController.php
│   │       ├── CheckoutController.php
│   │       └── InvoiceController.php
│   └── Middleware/
│       └── EnsureSubscribed.php  ← Subscription check
├── Models/
│   └── User.php                  ← Billable trait
├── Listeners/
│   └── StripeEventListener.php   ← Webhook handling
└── Services/
    └── BillingService.php        ← Business logic

config/
├── cashier.php                   ← Stripe/Paddle config
└── services.php                  ← API keys

routes/
└── web.php                       ← Webhook routes (excluded from CSRF)
```

---

## FuseCore Integration

When working in a **FuseCore project**, billing follows the modular structure:

```
FuseCore/
├── Core/                         # Infrastructure (priority 0)
│   └── App/Contracts/
│       └── BillingServiceInterface.php  ← Billing contract
│
├── User/                         # Auth module (existing)
│   └── App/Models/User.php       ← Add Billable trait here
│
├── Billing/                      # Billing module (new)
│   ├── App/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   ├── SubscriptionController.php
│   │   │   │   ├── CheckoutController.php
│   │   │   │   └── WebhookController.php
│   │   │   └── Middleware/
│   │   │       └── EnsureSubscribed.php
│   │   ├── Listeners/
│   │   │   └── HandleWebhookEvents.php
│   │   └── Services/
│   │       └── BillingService.php
│   ├── Config/
│   │   └── cashier.php           ← Module-level config
│   ├── Database/Migrations/
│   ├── Routes/
│   │   ├── web.php               ← Webhooks (no CSRF)
│   │   └── api.php               ← Subscription management
│   └── module.json               # dependencies: ["User"]
```

### FuseCore Billing Checklist

- [ ] Billing code in `/FuseCore/Billing/` module
- [ ] Billable trait on User model in `/FuseCore/User/`
- [ ] Webhook routes in `/FuseCore/Billing/Routes/web.php`
- [ ] Exclude webhook from CSRF in `VerifyCsrfToken`
- [ ] Declare `"User"` dependency in `module.json`

→ See [fusecore skill](../fusecore/SKILL.md) for complete module patterns.

---

## Decision Guide

### Stripe vs Paddle

```
Selling to businesses (B2B)? → Stripe
├── Need OAuth for third-party apps? → Stripe Connect
└── Selling to consumers (B2C) globally?
    ├── Want to handle taxes yourself? → Stripe + Stripe Tax
    └── Want tax compliance handled? → Paddle
```

### Subscription vs One-Time

```
Recurring revenue? → Subscription
├── Fixed plans? → Single-price subscription
└── Usage-based? → Metered billing (Stripe) or quantity-based
Single purchase? → One-time charge
├── Digital product? → Checkout session
└── Service fee? → Direct charge
```

---

## Key Concepts

| Concept | Description | Reference |
|---------|-------------|-----------|
| **Billable** | Trait that enables billing on a model | [stripe.md](references/stripe.md) |
| **Subscription** | Recurring billing cycle | [subscriptions.md](references/subscriptions.md) |
| **Price ID** | Stripe/Paddle price identifier | [stripe.md](references/stripe.md) |
| **Grace Period** | Time after cancellation with access | [subscriptions.md](references/subscriptions.md) |
| **Webhook** | Server-to-server payment notifications | [webhooks.md](references/webhooks.md) |
| **Customer Portal** | Self-service billing management | [checkout.md](references/checkout.md) |

---

## Reference Guide

### Concepts (WHY & Architecture)

| Topic | Reference | When to Consult |
|-------|-----------|-----------------|
| **Stripe Cashier** | [stripe.md](references/stripe.md) | Stripe setup, configuration |
| **Paddle Cashier** | [paddle.md](references/paddle.md) | Paddle setup, differences |
| **Subscriptions** | [subscriptions.md](references/subscriptions.md) | Create, cancel, swap, pause |
| **Webhooks** | [webhooks.md](references/webhooks.md) | Webhook security, handling |
| **Invoices** | [invoices.md](references/invoices.md) | PDF generation, receipts |
| **Payment Methods** | [payment-methods.md](references/payment-methods.md) | Cards, wallets, updates |
| **Checkout** | [checkout.md](references/checkout.md) | Hosted checkout, portal |
| **Testing** | [testing.md](references/testing.md) | Test cards, webhook testing |

### Advanced SaaS Features

| Topic | Reference | When to Consult |
|-------|-----------|-----------------|
| **Metered Billing** | [metered-billing.md](references/metered-billing.md) | Usage-based pricing (API, storage) |
| **Team Billing** | [team-billing.md](references/team-billing.md) | Organization billing, per-seat |
| **Dunning** | [dunning.md](references/dunning.md) | Failed payment recovery |
| **Feature Flags** | [feature-flags.md](references/feature-flags.md) | Plan-based feature access |

### Templates (Complete Code)

| Template | When to Use |
|----------|-------------|
| [UserBillable.php.md](references/templates/UserBillable.php.md) | User model with Billable trait |
| [SubscriptionController.php.md](references/templates/SubscriptionController.php.md) | CRUD subscription operations |
| [WebhookController.php.md](references/templates/WebhookController.php.md) | Custom webhook handling |
| [CheckoutController.php.md](references/templates/CheckoutController.php.md) | Stripe Checkout + Portal |
| [InvoiceController.php.md](references/templates/InvoiceController.php.md) | Invoice download |
| [BillingRoutes.php.md](references/templates/BillingRoutes.php.md) | Complete route definitions |
| [SubscriptionTest.php.md](references/templates/SubscriptionTest.php.md) | Pest tests for billing |
| [MeteredBillingController.php.md](references/templates/MeteredBillingController.php.md) | Usage tracking and reporting |
| [TeamBillable.php.md](references/templates/TeamBillable.php.md) | Team model with seat management |
| [DunningService.php.md](references/templates/DunningService.php.md) | Payment recovery automation |
| [FeatureFlags.php.md](references/templates/FeatureFlags.php.md) | Laravel Pennant per-plan features |

---

## Quick Reference

### Check Subscription Status

```php
// Has active subscription?
$user->subscribed('default');

// Subscribed to specific price?
$user->subscribedToPrice('price_premium', 'default');

// On trial?
$user->onTrial('default');

// Cancelled but still active?
$user->subscription('default')->onGracePeriod();
```

### Create Subscription

```php
// Simple subscription
$user->newSubscription('default', 'price_monthly')
    ->create($paymentMethodId);

// With trial
$user->newSubscription('default', 'price_monthly')
    ->trialDays(14)
    ->create($paymentMethodId);
```

### Manage Subscription

```php
$subscription = $user->subscription('default');

// Change plan
$subscription->swap('price_yearly');

// Cancel at period end
$subscription->cancel();

// Cancel immediately
$subscription->cancelNow();

// Resume cancelled subscription
$subscription->resume();
```

### Billing Portal

```php
// Redirect to customer portal (Stripe)
return $user->redirectToBillingPortal(route('dashboard'));

// Get portal URL
$url = $user->billingPortalUrl(route('dashboard'));
```

---

## Best Practices

### DO
- Use webhooks for payment confirmation
- Implement grace periods for cancelled subscriptions
- Set up webhook signature verification
- Handle `IncompletePayment` exceptions
- Test with Stripe CLI locally
- Prune old data regularly

### DON'T
- Trust client-side payment confirmations
- Store card numbers (PCI compliance)
- Skip webhook verification
- Ignore failed payment webhooks
- Forget to handle 3D Secure
- Hardcode prices (use env or config)

---

## Laravel 13 Notes

Cashier Stripe 16.x et Cashier Paddle 2.x sont **compatibles Laravel 13**. Points d'attention :

- Webhooks : la nouvelle protection CSRF [[laravel-auth]] `PreventRequestForgery` doit exclure les routes webhook (`stripe/webhook`, `paddle/webhook`) via `validateOrigin(except: [...])`
- `serializable_classes` : whitelister les DTOs Cashier si vous serialize des subscriptions (queue)
- PHP 8.3 minimum : Cashier 16.x supporte 8.3+ uniquement

```php
// bootstrap/app.php
->withMiddleware(function (Middleware $middleware) {
    $middleware->validateOrigin(except: [
        'stripe/*', 'paddle/*',
    ]);
})
```
