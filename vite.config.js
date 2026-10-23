import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Redirect ONLY UI icon imports to the shared iMove PNG component library.
// Keep lucide-react itself available for precision controls and fallback.
function imovePngIcons() {
  return {
    name: 'imove-png-icons',
    enforce: 'pre',
    transform(source, id) {
      const filename = id.split('?')[0].replace(/\\/g, '/');
      if (!/\.(jsx|tsx)$/.test(filename) || filename.endsWith('/adminPngLucide.jsx')) return null;
      if (filename.endsWith('/src/main.jsx') && !source.includes('admin-app-design.css')) {
        return { code: `${source}\nimport './admin-app-design.css';\n`, map: null };
      }
      if (!source.includes('lucide-react')) return null;
      const rewritten = source
        .replaceAll("from 'lucide-react'", "from './adminPngLucide.jsx'")
        .replaceAll('from "lucide-react"', "from './adminPngLucide.jsx'");
      return rewritten === source ? null : { code: rewritten, map: null };
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [imovePngIcons(), react()],
    server: {
      host: true,
      port: Number(env.VITE_DEV_PORT || 5173),
      strictPort: true,
    },
  };
});
