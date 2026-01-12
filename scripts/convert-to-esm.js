const fs = require("fs");
const path = require("path");

const serverFile = path.join(__dirname, "../server/index.js");
let content = fs.readFileSync(serverFile, "utf8");

// Add ESM bootstrap at the top (without path since it will be converted from require)
const esmBootstrap = `// ESM bootstrap (Docker)
import "dotenv/config";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
`;

// Convert require to import
content = content
  .replace(/require\('dotenv'\)\.config\(\);?/g, "")
  .replace(/const (\w+) = require\('([^']+)'\);/g, 'import $1 from "$2";')
  .replace(/const \{ (\w+) \} = require\('([^']+)'\);/g, 'import { $1 } from "$2";')
  .replace(/const (\w+) = require\("([^"]+)"\);/g, 'import $1 from "$2";')
  .replace(/const \{ (\w+) \} = require\("([^"]+)"\);/g, 'import { $1 } from "$2";');

// Handle pg special case
content = content.replace(
  /import \{ Pool \} from "pg";/g,
  'import pg from "pg";\nconst { Pool } = pg;'
);

// Add __dirname after path import
content = content.replace(
  /import path from "path";/,
  'import path from "path";\nconst __dirname = path.dirname(__filename);'
);

// Add bootstrap at the very top
content = esmBootstrap + content;

fs.writeFileSync(serverFile, content);
console.log("Converted server/index.js to ESM format");
