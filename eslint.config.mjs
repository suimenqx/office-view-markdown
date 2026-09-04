import tseslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import { importX } from "eslint-plugin-import-x";
import unusedImports from "eslint-plugin-unused-imports";

const tsFiles = ["src/**/*.{ts,tsx}"];

const scopeConfig = (config, files) => ({
	...config,
	files,
});

export default [
	{
		ignores: ["**/*.d.ts", "dist", "vditor", "out", "resource"],
	},
	...tseslint.configs["flat/recommended"].map((config) => scopeConfig(config, tsFiles)),
	{
		files: tsFiles,
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
		plugins: {
			"import-x": importX,
			"unused-imports": unusedImports,
		},
		settings: {
			...importX.flatConfigs.typescript.settings,
		},
		rules: {
			"unused-imports/no-unused-imports": "error",
			"@typescript-eslint/no-var-requires": "off",
			"@typescript-eslint/no-unused-vars": "off",
			"@typescript-eslint/no-empty-function": "off",
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-empty-object-type": "off",
			"@typescript-eslint/no-this-alias": "off"
		},
	},
];
