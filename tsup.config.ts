import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index:                'src/index.ts',
    'middleware/index':   'src/middleware/index.ts',
    'api/route-handler':  'src/api/route-handler.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  splitting: false,
  external: ['next', 'react', 'async_hooks'],
})