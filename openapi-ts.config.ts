import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
    input: "openapi.json", // or path to local spec
    output: {
        path: "src/lib/api",
        format: "prettier"
    },
    plugins: [
        {
            name: '@hey-api/typescript',
            enums: 'typescript'
        },
        '@hey-api/client-axios'
    ],
});
