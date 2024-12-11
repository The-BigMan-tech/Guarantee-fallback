import typography from '@tailwindcss/typography';
import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],

  theme: {
    extend: {
      fontFamily: {
        roboto: ["'Roboto Mono'", 'monospace'], // Add your font here
        space:["'Space Mono'",'serif']
      },
    }
  },

  plugins: [typography]
} satisfies Config;
