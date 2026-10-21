import { supabase } from "@/src/lib/supabase";
import type { Remote, RemoteRecord } from "@/src/lib/sync-engine";

const PAGE = 500;

/** Reads and writes the signed-in user's rows in `sync_records` (Pro only, enforced by RLS). */
export function supabaseRemote(userId: string): Remote {
	return {
		async pull(sinceMs) {
			if (!supabase) throw new Error("Cloud sync isn't configured.");
			const out: RemoteRecord[] = [];
			let cursor = new Date(sinceMs).toISOString();
			for (;;) {
				const { data, error } = await supabase
					.from("sync_records")
					.select("key, data, deleted, updated_at")
					.gt("updated_at", cursor)
					.order("updated_at", { ascending: true })
					.limit(PAGE);
				if (error) throw new Error(error.message);
				for (const row of data) {
					out.push({
						key: row.key as string,
						data: row.data,
						deleted: row.deleted as boolean,
						updatedAt: new Date(row.updated_at as string).getTime(),
					});
				}
				if (data.length < PAGE) break;
				cursor = data[data.length - 1]?.updated_at as string;
			}
			return out;
		},

		async push(records) {
			if (!supabase) throw new Error("Cloud sync isn't configured.");
			const { error } = await supabase.from("sync_records").upsert(
				records.map((r) => ({
					user_id: userId,
					key: r.key,
					data: r.data,
					deleted: r.deleted,
				})),
				{ onConflict: "user_id,key" },
			);
			if (error) throw new Error(error.message);
		},
	};
}
