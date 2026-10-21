/**
 * Two-way sync of independent records (one per workout day, plus a few collections).
 * Each record is last-write-wins: a record changed on this phone after the server copy was
 * written is kept and uploaded, otherwise the server copy replaces the local one.
 *
 * Pure logic over two small interfaces so it can be tested without a phone or a server.
 */

export interface RemoteRecord {
	key: string;
	data: unknown;
	deleted: boolean;
	/** Server time the record was last written, in ms. */
	updatedAt: number;
}

export interface Remote {
	/** Records written after `sinceMs`, oldest first. */
	pull(sinceMs: number): Promise<RemoteRecord[]>;
	push(
		records: { key: string; data: unknown; deleted: boolean }[],
	): Promise<void>;
}

export interface Local {
	dirty(): Promise<{ key: string; ts: number }[]>;
	read(key: string): Promise<{ data: unknown; deleted: boolean }>;
	apply(key: string, data: unknown, deleted: boolean): Promise<void>;
	clearDirty(key: string, ts: number): Promise<void>;
}

export interface SyncResult {
	pulled: number;
	pushed: number;
	/** Pass back in as `sinceMs` next time. */
	cursor: number;
}

const same = (a: unknown, b: unknown) =>
	JSON.stringify(a) === JSON.stringify(b);

export async function runSync(
	local: Local,
	remote: Remote,
	sinceMs: number,
): Promise<SyncResult> {
	const incoming = await remote.pull(sinceMs);
	const dirty = new Map((await local.dirty()).map((d) => [d.key, d.ts]));

	let pulled = 0;
	let cursor = sinceMs;
	for (const rec of incoming) {
		cursor = Math.max(cursor, rec.updatedAt);
		const ts = dirty.get(rec.key);
		// Changed here after the server copy was written: ours wins and gets uploaded below.
		if (ts !== undefined && ts > rec.updatedAt) continue;

		const current = await local.read(rec.key);
		const identical =
			current.deleted === rec.deleted &&
			(rec.deleted || same(current.data, rec.data));
		if (!identical) {
			await local.apply(rec.key, rec.data, rec.deleted);
			pulled++;
		}
		if (ts !== undefined) {
			await local.clearDirty(rec.key, ts);
			dirty.delete(rec.key);
		}
	}

	const outgoing: {
		key: string;
		data: unknown;
		deleted: boolean;
		ts: number;
	}[] = [];
	for (const [key, ts] of dirty) {
		const rec = await local.read(key);
		outgoing.push({ key, ts, ...rec });
	}
	for (let i = 0; i < outgoing.length; i += 100) {
		const chunk = outgoing.slice(i, i + 100);
		await remote.push(
			chunk.map(({ key, data, deleted }) => ({ key, data, deleted })),
		);
		for (const r of chunk) await local.clearDirty(r.key, r.ts);
	}

	return { pulled, pushed: outgoing.length, cursor };
}
