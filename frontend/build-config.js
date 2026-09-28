const fs = require("fs");
const path = require("path");

const apiUrl = process.env.API_URL || "http://localhost:5000/api";
const configContent = `window.__APP_CONFIG__ = {
  API_URL: '${apiUrl}'
};\n`;

const targetPath = path.join(__dirname, "config.js");

fs.writeFileSync(targetPath, configContent, "utf8");
console.log(`Generated config.js with API_URL=${apiUrl}`);
