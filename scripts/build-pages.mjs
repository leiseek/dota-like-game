import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const pagesDir = "pages-dist";

rmSync(pagesDir, { recursive: true, force: true });
mkdirSync(pagesDir, { recursive: true });

cpSync("platform-web", join(pagesDir, "platform-web"), {
  recursive: true,
  filter: (source) => !source.includes("node_modules"),
});
cpSync("dist", join(pagesDir, "dist"), { recursive: true });

writeFileSync(join(pagesDir, ".nojekyll"), "");
writeFileSync(
  join(pagesDir, "index.html"),
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="refresh" content="0; url=./platform-web/" />
    <title>Ancient Defense Web Preview</title>
  </head>
  <body>
    <p><a href="./platform-web/">Open Ancient Defense Web Preview</a></p>
  </body>
</html>
`,
);

console.log(`GitHub Pages artifact prepared in ${pagesDir}/`);
