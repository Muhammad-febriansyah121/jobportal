import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    resolve: {
        dedupe: ['react', 'react-dom'],
        alias: {
            '@': path.resolve(projectRoot, 'resources/js'),
        },
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
        }),
        inertia(),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes('node_modules')) {
                        return undefined;
                    }
                    if (id.includes('lucide-react')) {
                        return 'lucide';
                    }
                    if (id.includes('@radix-ui') || id.includes('radix-ui')) {
                        return 'radix';
                    }
                    if (id.includes('@tiptap') || id.includes('prosemirror')) {
                        return 'tiptap';
                    }
                    if (id.includes('firebase')) {
                        return 'firebase';
                    }
                    if (id.includes('@inertiajs')) {
                        return 'inertia';
                    }
                    if (
                        id.includes('/react-dom/') ||
                        id.includes('/scheduler/') ||
                        id.includes('/node_modules/react/')
                    ) {
                        return 'react';
                    }
                    if (id.includes('framer-motion') || id.includes('/motion/')) {
                        return 'motion';
                    }
                    if (id.includes('date-fns') || id.includes('dayjs')) {
                        return 'date';
                    }
                    return 'vendor';
                },
            },
        },
    },
});
