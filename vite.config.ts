import { createMpaPlugin, createPages } from "vite-plugin-virtual-mpa";
import { defineConfig, normalizePath } from "vite";

const pages = createPages([
  {
    name: "botw",
    filename: "botw/index.html",
    entry: "/src/botw.ts",
    data: {
      title: "Breath of the Wild Interactive Map",
      description:
        "Interactive, searchable map of Hyrule with locations, descriptions, guides, and more.",
    },
  },
  {
    name: "la",
    filename: "la/index.html",
    entry: "/src/la.ts",
    data: {
      title: "Link's Awakening Interactive Map (Nintendo Switch)",
      description:
        "Interactive, searchable map of Koholint with locations, descriptions, guides, and more.",
    },
  },
  {
    name: "totk",
    filename: "totk/index.html",
    entry: "/src/totk.ts",
    data: {
      title: "Tears of the Kingdom Interactive Map",
      description:
        "Interactive, searchable map of Hyrule with locations, descriptions, guides, and more.",
    },
  },
  {
    name: "ss",
    filename: "ss/index.html",
    entry: "/src/ss.ts",
    data: {
      title: "Skyward Sword Interactive Map",
      description:
        "Interactive, searchable map of Hyrule with locations, descriptions, guides, and more.",
    },
  },
]);

// tslint:disable-next-line:no-default-export vite convention
export default defineConfig(({ command, mode, ssrBuild }) => ({
  base: mode === "production" ? "/maps/" : "/maps-beta/",
  plugins: [
    createMpaPlugin({
      template: "src/template.html",
      pages,
    }),
  ],
}));
