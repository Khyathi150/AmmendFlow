import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rollupNativePath = path.resolve(__dirname, '../node_modules/rollup/dist/native.js');

if (fs.existsSync(rollupNativePath)) {
  let content = fs.readFileSync(rollupNativePath, 'utf8');
  if (!content.includes('@rollup/wasm-node/dist/native.js')) {
    const target = `const nativeModule = requireWithFriendlyError(
\texistsSync(path.join(__dirname, localName)) ? localName : \`@rollup/rollup-\${packageBase}\`
);`;

    const replacement = `let nativeModule;
try {
\tnativeModule = requireWithFriendlyError(
\t\texistsSync(path.join(__dirname, localName)) ? localName : \`@rollup/rollup-\${packageBase}\`
\t);
} catch (e) {
\ttry {
\t\tnativeModule = require('@rollup/wasm-node/dist/native.js');
\t} catch (wasmErr) {
\t\tthrow e;
\t}
}`;

    if (content.includes(target)) {
      content = content.replace(target, replacement);
      fs.writeFileSync(rollupNativePath, content, 'utf8');
      console.log('[AmendFlow] Successfully patched rollup for Windows WDAC/AppLocker WASM fallback.');
    }
  }
}
