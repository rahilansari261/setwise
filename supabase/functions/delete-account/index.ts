// Deletes the calling user's Supabase auth account.
// Setwise keeps all workout data on the phone, so the auth user is the only thing to remove here.
// Deploy: npx supabase functions deploy delete-account
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { ...cors, "Content-Type": "application/json" },
	});

Deno.serve(async (req) => {
	if (req.method === "OPTIONS") return new Response(null, { headers: cors });
	if (req.method !== "POST") return json({ error: "Use POST" }, 405);

	const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
	if (!token) return json({ error: "Missing Authorization header" }, 401);

	const admin = createClient(
		Deno.env.get("SUPABASE_URL") ?? "",
		Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
		{
			auth: { persistSession: false, autoRefreshToken: false },
		},
	);

	// The token is verified here (not by the gateway) so it works with both legacy and new JWT signing keys.
	const { data, error } = await admin.auth.getUser(token);
	if (error || !data.user) return json({ error: "Not signed in" }, 401);

	const { error: deleteError } = await admin.auth.admin.deleteUser(
		data.user.id,
	);
	if (deleteError) return json({ error: deleteError.message }, 500);

	return json({ deleted: true });
});
