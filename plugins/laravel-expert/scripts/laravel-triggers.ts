/**
 * laravel-triggers.ts — TS port of laravel_skill_triggers.py (data + detector).
 *
 * Domain-skill trigger map for Laravel/PHP, compiled case-insensitive to match
 * the Python re.IGNORECASE. Pattern groups mirror laravel_patterns.py exactly.
 * The detect/consulted logic comes from the shared makeSkillDetector factory so
 * the trigger file stays data-only (framework bound to "laravel").
 */
import { makeSkillDetector } from "../../core-guards/scripts/_shared/skill-trigger-detector";

/** Compile raw patterns case-insensitive (re.IGNORECASE parity). */
const ci = (patterns: string[]): RegExp[] => patterns.map((p) => new RegExp(p, "i"));

/** Ordered Laravel domain-skill triggers (pattern → skill), order = py dict. */
export const LARAVEL_TRIGGERS: Record<string, RegExp[]> = {
  fusecore: ci(["FuseCore\\\\[A-Za-z]+\\\\App\\\\", "use HasModule\\b", "ModuleServiceProvider\\b", "ModuleInterface\\b"]),
  "laravel-eloquent": ci([
    "(extends Model|HasFactory|belongsTo|hasMany|hasOne|morphTo)\\b",
    "\\$this->belongsToMany|->with\\(|->whereHas\\(",
    "(Eloquent|Model)::(find|where|create|update|all)\\b",
  ]),
  "laravel-api": ci([
    "(JsonResource|ResourceCollection|apiResource)\\b",
    "Route::(get|post|put|delete|apiResource)\\(",
    "(response\\(\\)->json|Request \\$request)\\b",
  ]),
  "laravel-auth": ci([
    "(Auth::|auth\\(\\)|Sanctum|Passport|Socialite)\\b",
    "(Gate::|Policy|can\\(|authorize)\\b",
    "(middleware\\(['\"]auth|LoginController|RegisterController)\\b",
  ]),
  "laravel-livewire": ci(["(extends Component|Livewire|wire:|#\\[On)\\b", "(mount|render|emit|dispatch)\\(\\)", "@livewire|<livewire:"]),
  "laravel-queues": ci(["(implements ShouldQueue|dispatch\\(|Bus::)\\b", "(Queue::|Job|Batch|Chain)\\b", "(onQueue|onConnection|tries|backoff)\\b"]),
  "laravel-billing": ci(["(Billable|subscription|Cashier)\\b", "(createSubscription|newSubscription|charge)\\("]),
  "laravel-stripe-connect": ci([
    "(StripeConnect|connectAccount|onboardingUrl)\\b",
    "(paymentIntent|transfer|payout|splitPayment)\\b",
    "Stripe\\\\\\\\(Account|Transfer|PaymentIntent)\\b",
  ]),
  "laravel-testing": ci([
    "(extends TestCase|RefreshDatabase|WithFaker)\\b",
    "(assertStatus|assertJson|assertSee|assertRedirect)\\(",
    "(factory\\(|Pest|it\\(|test\\(|expect\\()\\b",
  ]),
  "laravel-migrations": ci([
    "(Schema::|Blueprint|->table|->create)\\b",
    "(->string|->integer|->boolean|->foreignId|->index)\\(",
    "extends Migration\\b",
  ]),
  "laravel-blade": ci(["(@extends|@section|@yield|@component|@slot)\\b", "(@if|@foreach|@include|@push|@stack)\\b", "(Blade::|x-[a-z])\\b"]),
  "laravel-permission": ci(["(hasRole|givePermissionTo|assignRole|spatie)\\b", "(Permission|Role)::(create|findByName)\\b", "@can\\b|@role\\b|middleware.*role:"]),
  "laravel-i18n": ci(["(__\\(|trans\\(|trans_choice\\(|@lang)\\b", "Lang::|->locale\\(|setLocale\\b"]),
  "laravel-vite": ci(["(@vite|@viteReactRefresh|Vite::)\\b"]),
};

const detector = makeSkillDetector("laravel", LARAVEL_TRIGGERS);
export const detectRequiredSkills = detector.detectRequiredSkills;
export const specificSkillConsulted = detector.specificSkillConsulted;
