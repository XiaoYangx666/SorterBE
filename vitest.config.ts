import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const stub = (name: string) => fileURLToPath(new URL(`./test/stubs/${name}.ts`, import.meta.url));

export default defineConfig({
	test: {
		include: ["test/**/*.test.ts"],
		environment: "node",
		clearMocks: true,
	},
	resolve: {
		alias: [
			// 精确匹配，避免 "sapi-pro" 的别名吞掉 "sapi-pro/func" 等子路径
			{ find: /^@minecraft\/server$/, replacement: stub("minecraft-server") },
			{ find: /^@minecraft\/server-ui$/, replacement: stub("minecraft-server-ui") },
			{ find: /^sapi-pro$/, replacement: stub("sapi-pro") },
			{ find: /^sapi-pro\/Deferred$/, replacement: stub("sapi-pro-deferred") },
			{ find: /^sapi-pro\/func$/, replacement: stub("sapi-pro-func") },
			{ find: /^sapi-pro\/Event$/, replacement: stub("sapi-pro-event") },
		],
	},
});
