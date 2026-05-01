import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  srcDir: "src",
  manifest: {
    name: "ru-input-tabs-links",
    description:
      "Type !tabs in any input field to get a popup with all open tab URLs. Click a tab to insert its URL.",
    permissions: ["tabs", "activeTab", "scripting", "clipboardWrite"],
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
