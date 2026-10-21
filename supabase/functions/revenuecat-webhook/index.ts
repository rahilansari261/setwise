// Receives RevenueCat webhooks and keeps public.entitlements in step with Play Store billing.
// RevenueCat's app_user_id is the Supabase user id (the app calls Purchases.logIn(user.id)).
//
// Setup:
//   1. npx supabase secrets set REVENUECAT_WEBHOOK_AUTH="<long random string>"
//   2. npx supabase functions deploy revenuecat-webhook --no-verify-jwt
//   3. RevenueCat dashboard > Integrations > Webhooks: URL = <project>/functions/v1/revenuecat-webhook,
//      Authorization header value = the same string as step 1.
import { createClient } from "jsr:@supabase/supabase-js@2";

const ENTITLEMENT_ID = "pro";

// Events that mean "this user has an active entitlement until expiration_at_ms".
const GRANT = new Set([
	"INITIAL_PURCHASE",
	"RENEWAL",
	"PRODUCT_CHANGE",
	"UNCANCELLATION",
	"NON_RENEWING_PURCHASE",
	"TEMPORARY_ENTITLEMENT_GRANT",
	"SUBSCRIPTION_EXTENDED",
]);
const REVOKE = new Set(["EXPIRATION", "REFUND"]);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const json = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});

function timingSafeEqual(a: string, b: string) {
	const x = new TextEncoder().encode(a);
	const y = new TextEncoder().encode(b);
	if (x.length !== y.length) return false;
	let diff = 0;
	for (let i = 0; i < x.length; i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
	return diff === 0;
}

Deno.serve(async (req) => {
	if (req.method !== "POST") return json({ error: "Use POST" }, 405);

	const secret = Deno.env.get("REVENUECAT_WEBHOOK_AUTH");
	const sent =
		req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
	if (!secret || !timingSafeEqual(sent, secret))
		return json({ error: "Unauthorized" }, 401);

	let event: Record<string, unknown>;
	try {
		event =
			((await req.json()) as { event?: Record<string, unknown> }).event ?? {};
	} catch {
		return json({ error: "Bad JSON" }, 400);
	}

	const type = String(event.type ?? "");
	const userId = String(event.app_user_id ?? "");
	const entitlements = (event.entitlement_ids as string[] | null) ?? [];
	// Anonymous RevenueCat ids ($RCAnonymousID:…) aren't Supabase users; nothing to record.
	if (!UUID.test(userId)) return json({ ignored: "anonymous user" });
	if (entitlements.length > 0 && !entitlements.includes(ENTITLEMENT_ID))
		return json({ ignored: "other entitlement" });

	const admin = createClient(
		Deno.env.get("SUPABASE_URL") ?? "",
		Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
		{ auth: { persistSession: false, autoRefreshToken: false } },
	);

	let row: { is_pro: boolean; expires_at: string | null } | null = null;
	if (GRANT.has(type)) {
		const ms = Number(event.expiration_at_ms);
		row = {
			is_pro: true,
			// Lifetime purchases come without an expiry.
			expires_at:
				Number.isFinite(ms) && ms > 0 ? new Date(ms).toISOString() : null,
		};
	} else if (REVOKE.has(type)) {
		row = { is_pro: false, expires_at: new Date().toISOString() };
	}
	// CANCELLATION / BILLING_ISSUE keep access until the paid period ends (EXPIRATION follows).
	if (!row) return json({ ignored: type });

	const { error } = await admin.from("entitlements").upsert({
		user_id: userId,
		...row,
		source: "revenuecat",
		updated_at: new Date().toISOString(),
	});
	if (error) return json({ error: error.message }, 500);
	return json({ ok: true, type });
});
