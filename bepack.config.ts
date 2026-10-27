import { defineConfig, sapiPro } from "@bepack/cli";

export default defineConfig({
	root: ".",
	target: "latest",
	pack: {
		outDir: "dist",
	},
	manifestFormat: 2,
	version: "1.5.0",
	name: "Sorter自动整理",
	description: "MCBE Auto Sorter",
	packs: {
		bp: {
			root: ".",
			uuid: "30c36031-59ea-4892-9b09-4dfd33ef0fc9",
			moduleUuid: "8ea983b5-d841-4f81-9ecd-b222b5c73aed",
			compile: {
				entry: "src/main.ts",
			},
			name: "Sorter自动整理",
			description: "MCBE Auto Sorter",
			dependencies: {
				"@minecraft/server": "stable",
				"@minecraft/server-ui": "stable",
				"sapi-pro": "stable",
			},
		},
	},
	replace: {
		builtins: {
			NAME: true,
			DESCRIPTION: true,
			VERSION: true,
			UUID: true,
		},
	},
	plugins: [sapiPro()],
	install: {
		registry: "https://registry.npmmirror.com",
	},
});
