// Run with: npx tsx src/lib/sync-engine.test.ts
import assert from "node:assert/strict";

import {
	type Local,
	type Remote,
	type RemoteRecord,
	runSync,
} from "./sync-engine";

class FakeServer implements Remote {
	rows = new Map<string, RemoteRecord>();
	clock = 1000;
	async pull(since: number) {
		return [...this.rows.values()]
			.filter((r) => r.updatedAt > since)
			.sort((a, b) => a.updatedAt - b.updatedAt);
	}
	async push(records: { key: string; data: unknown; deleted: boolean }[]) {
		for (const r of records)
			this.rows.set(r.key, { ...r, updatedAt: ++this.clock });
	}
}

class FakePhone implements Local {
	data = new Map<string, unknown>();
	dirtyMap = new Map<string, number>();
	cursor = 0;
	applied = 0;
	edit(key: string, value: unknown, ts: number) {
		if (value === null) this.data.delete(key);
		else this.data.set(key, value);
		this.dirtyMap.set(key, ts);
	}
	async dirty() {
		return [...this.dirtyMap].map(([key, ts]) => ({ key, ts }));
	}
	async read(key: string) {
		return this.data.has(key)
			? { data: this.data.get(key), deleted: false }
			: { data: null, deleted: true };
	}
	async apply(key: string, data: unknown, deleted: boolean) {
		this.applied++;
		if (deleted) this.data.delete(key);
		else this.data.set(key, data);
	}
	async clearDirty(key: string, ts: number) {
		if ((this.dirtyMap.get(key) ?? Number.POSITIVE_INFINITY) <= ts)
			this.dirtyMap.delete(key);
	}
	async sync(server: Remote) {
		const r = await runSync(this, server, this.cursor);
		this.cursor = r.cursor;
		return r;
	}
}

const tests: [string, () => Promise<void>][] = [];
const test = (name: string, fn: () => Promise<void>) => tests.push([name, fn]);

test("a new record is uploaded and appears on a second phone", async () => {
	const server = new FakeServer();
	const a = new FakePhone();
	const b = new FakePhone();
	a.edit("day:2026-10-21", { sets: 3 }, 5000);
	assert.equal((await a.sync(server)).pushed, 1);
	assert.equal(a.dirtyMap.size, 0);
	assert.equal((await b.sync(server)).pulled, 1);
	assert.deepEqual(b.data.get("day:2026-10-21"), { sets: 3 });
});

test("deleting a day removes it on the other phone", async () => {
	const server = new FakeServer();
	const a = new FakePhone();
	const b = new FakePhone();
	a.edit("day:x", { n: 1 }, 5000);
	await a.sync(server);
	await b.sync(server);
	a.edit("day:x", null, 6000);
	await a.sync(server);
	await b.sync(server);
	assert.equal(b.data.has("day:x"), false);
});

test("a record edited later on this phone beats an older server copy", async () => {
	const server = new FakeServer();
	const a = new FakePhone();
	const b = new FakePhone();
	a.edit("routines", ["old"], 5000);
	await a.sync(server);
	await b.sync(server);
	// b edits after the server copy was written (server time ≈ 1001).
	b.edit("routines", ["new from b"], 9999);
	await b.sync(server);
	await a.sync(server);
	assert.deepEqual(a.data.get("routines"), ["new from b"]);
	assert.deepEqual(server.rows.get("routines")?.data, ["new from b"]);
});

test("a newer server copy beats an older local edit (fresh phone, ts 0)", async () => {
	const server = new FakeServer();
	const a = new FakePhone();
	a.edit("routines", ["real routines"], 5000);
	await a.sync(server);
	const fresh = new FakePhone();
	fresh.edit("routines", ["defaults"], 0);
	await fresh.sync(server);
	assert.deepEqual(fresh.data.get("routines"), ["real routines"]);
	assert.deepEqual(server.rows.get("routines")?.data, ["real routines"]);
});

test("records on different days from two phones are both kept", async () => {
	const server = new FakeServer();
	const a = new FakePhone();
	const b = new FakePhone();
	a.edit("day:1", { by: "a" }, 5000);
	b.edit("day:2", { by: "b" }, 5000);
	await a.sync(server);
	await b.sync(server);
	await a.sync(server);
	assert.deepEqual(a.data.get("day:2"), { by: "b" });
	assert.deepEqual(b.data.get("day:1"), { by: "a" });
});

test("syncing again with no changes does nothing", async () => {
	const server = new FakeServer();
	const a = new FakePhone();
	a.edit("day:1", { a: 1 }, 5000);
	await a.sync(server);
	a.applied = 0;
	const r = await a.sync(server); // sees its own upload, which is identical
	assert.equal(r.pulled, 0);
	assert.equal(r.pushed, 0);
	assert.equal(a.applied, 0);
});

test("edits made during a sync stay dirty", async () => {
	const server = new FakeServer();
	const a = new FakePhone();
	a.edit("day:1", { v: 1 }, 5000);
	const realRead = a.read.bind(a);
	a.read = async (key) => {
		const out = await realRead(key);
		a.edit("day:1", { v: 2 }, 7000); // user edits while the sync is running
		return out;
	};
	await a.sync(server);
	assert.equal(a.dirtyMap.get("day:1"), 7000);
});

test("pushes more than one chunk", async () => {
	const server = new FakeServer();
	const a = new FakePhone();
	for (let i = 0; i < 250; i++) a.edit(`day:${i}`, { i }, 5000);
	assert.equal((await a.sync(server)).pushed, 250);
	assert.equal(server.rows.size, 250);
});

(async () => {
	let failed = 0;
	for (const [name, fn] of tests) {
		try {
			await fn();
			console.log("ok  ", name);
		} catch (e) {
			failed++;
			console.log("FAIL", name, e);
		}
	}
	process.exit(failed ? 1 : 0);
})();
