import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

/**
 * Configuration ESLint (format « flat », ESLint 9).
 *
 * ESLint n'était pas installé : `npm run lint` échouait et la vérification
 * était désactivée au build. Le socle Next est activé ; les règles les plus
 * bruyantes sur la base existante restent en avertissement, afin que le lint
 * serve à repérer les vraies erreurs sans bloquer.
 */
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

export default [
  ...compat.extends("next/core-web-vitals"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      ".next-*/**",
      "public/**",
      "uploads/**",
      "styles/globals.css",
    ],
  },
  {
    rules: {
      // Images : le projet sert ses fichiers via /api/files/... (pas de next/image).
      "@next/next/no-img-element": "off",
      // Base historique : signalés sans bloquer.
      "react/no-unescaped-entities": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "jsx-a11y/alt-text": "warn",
    },
  },
];
