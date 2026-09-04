import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build, context } from 'esbuild'

const __dirname = dirname(fileURLToPath(import.meta.url))

const isProd = process.argv.indexOf('--mode=production') >= 0;
const devExtensionTarget = process.env.OFFICE_EXTENSION_TARGET;

// Production always builds both; dev builds one target at a time.
const buildDesktop = isProd || devExtensionTarget !== 'web';
const buildWeb = isProd || devExtensionTarget === 'web';

const nodeBuiltinStubs = ['fs', 'child_process', 'os', 'crypto', 'stream', 'https', 'http', 'net', 'tls', 'zlib', 'events', 'util', 'buffer', 'module', 'url', 'assert', 'string_decoder']

function createNodeShimPlugin() {
    const shimDir = resolve(__dirname, 'src/shims');
    const packageStubs = {
        'file-type': 'file-type.ts',
    };
    return {
        name: 'node-shim',
        setup(build) {
            build.onResolve({ filter: /^path$/ }, () => ({ path: resolve(shimDir, 'path.ts') }));
            build.onResolve({ filter: /^node:path$/ }, () => ({ path: resolve(shimDir, 'path.ts') }));
            for (const [moduleName, stubFile] of Object.entries(packageStubs)) {
                build.onResolve({ filter: new RegExp(`^${moduleName}$`) }, () => ({
                    path: resolve(shimDir, stubFile),
                }));
            }
            for (const moduleName of nodeBuiltinStubs) {
                const stubPath = resolve(shimDir, `${moduleName}.ts`);
                build.onResolve({ filter: new RegExp(`^${moduleName}$`) }, () => ({
                    path: existsSync(stubPath) ? stubPath : resolve(shimDir, 'empty-stub.ts'),
                }));
            }
            build.onResolve({ filter: /^node:/ }, (args) => {
                const bare = args.path.slice(5);
                if (bare === 'fs/promises') {
                    return { path: resolve(shimDir, 'fs.ts') };
                }
                const stubPath = resolve(shimDir, `${bare}.ts`);
                return {
                    path: existsSync(stubPath) ? stubPath : resolve(shimDir, 'empty-stub.ts'),
                };
            });
        },
    };
}

function createBuildNoticePlugin() {
    return {
        name: 'build notice',
        setup(build) {
            build.onStart(() => {
                console.log('build start')
            })
            build.onEnd(() => {
                console.log('build success')
            })
        }
    };
}

async function runBuild(shouldWatch, options) {
    if (shouldWatch) {
        const ctx = await context(options);
        await ctx.watch();
        return ctx;
    }
    return build(options);
}

function buildDesktopExtension() {
    const shouldWatch = !isProd && devExtensionTarget !== 'web';
    return runBuild(shouldWatch, {
        entryPoints: ['./src/extension.ts'],
        bundle: true,
        outfile: "out/extension.js",
        external: ['vscode'],
        format: 'cjs',
        platform: 'node',
        minify: isProd,
        sourcemap: !isProd,
        logOverride: {
            'duplicate-object-key': "silent",
            'suspicious-boolean-not': "silent",
        },
        plugins: [
            createBuildNoticePlugin(),
        ],
    })
}

function buildWebExtension() {
    const shouldWatch = !isProd && devExtensionTarget === 'web';
    return runBuild(shouldWatch, {
        entryPoints: ['./src/extension.web.ts'],
        bundle: true,
        outfile: "out/extension.web.js",
        external: ['vscode'],
        format: 'cjs',
        platform: 'browser',
        target: ['es2021'],
        minify: isProd,
        sourcemap: !isProd,
        logOverride: {
            'duplicate-object-key': "silent",
            'suspicious-boolean-not': "silent",
        },
        banner: {
            js: 'var global = globalThis; var Buffer = globalThis.Buffer || { from: (value, encoding) => encoding === "binary" ? Uint8Array.from(value, (c) => c.charCodeAt(0)) : new TextEncoder().encode(String(value)) };',
        },
        plugins: [
            createNodeShimPlugin(),
            createBuildNoticePlugin(),
        ],
    })
}

(async () => {
    try {
        if (buildDesktop) {
            await buildDesktopExtension();
        }
        if (buildWeb) {
            await buildWebExtension();
        }
    } catch {
        process.exit(1);
    }
})();
