// sapi-pro 的最小替身：只保留排序逻辑依赖的语言树、翻译器、数据库与日志。
// 真实 sapi-pro 在导入时会注册世界事件，无法直接在 Node 下运行。

export type LangText = unknown;

export function defineLangTree<T extends object>(tree: T): T {
	return tree;
}

function render(text: unknown, params?: Record<string, string | number | LangText>) {
	if (typeof text !== "string") return String(text);
	return text.replace(/\{(\w+)\}/g, (_, key: string) => String(params?.[key] ?? `{${key}}`));
}

export const translator = {
	createFor: () => (text: unknown, params?: Record<string, string | number | LangText>) =>
		render(text, params),
	createPureFor: () => (text: unknown, params?: Record<string, string | number | LangText>) =>
		render(text, params),
	translate: (text: unknown) => text,
};

export class Logger {
	constructor(public readonly namespace: string) {}
	info() {}
	warn() {}
	error() {}
	debug() {}
}

const configStore = new Map<string, unknown>();

export class Configdb {
	static readonly store = configStore;

	static getJSON<T>(key: string, guard?: (value: unknown) => value is T): T | undefined {
		const value = configStore.get(key);
		if (value === undefined) return undefined;
		if (guard && !guard(value)) return undefined;
		return value as T;
	}

	static setJSON(key: string, value: unknown) {
		configStore.set(key, structuredClone(value));
	}
}

const scoreStore = new Map<string, Map<string, number>>();

export class ScoreBoardDataBase {
	static readonly store = scoreStore;

	private readonly map: Map<string, number>;

	constructor(public readonly objective: string) {
		let map = scoreStore.get(objective);
		if (!map) {
			map = new Map();
			scoreStore.set(objective, map);
		}
		this.map = map;
	}

	private key(target: { id: string } | string) {
		return typeof target === "string" ? target : target.id;
	}

	get(target: { id: string } | string) {
		return this.map.get(this.key(target));
	}

	set(target: { id: string } | string, value: number) {
		this.map.set(this.key(target), value);
	}

	has(target: { id: string } | string) {
		return this.map.has(this.key(target));
	}
}

export const Vector3Utils = {
	distance(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) {
		return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
	},
};
