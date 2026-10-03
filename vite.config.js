import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        work: resolve(__dirname, 'work.html'),
        contact: resolve(__dirname, 'contact.html'),
        services: resolve(__dirname, 'services.html'),
        project: resolve(__dirname, 'project.html'),
        admin: resolve(__dirname, 'admin.html'),
        notfound: resolve(__dirname, '404.html'), privacy: resolve(__dirname, 'privacy.html')
      }
    }
  }
});
