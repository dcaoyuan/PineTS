// SPDX-License-Identifier: AGPL-3.0-only
import { readdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const requestDir = join(__dirname, '../src/namespaces/request');
const methodsDir = join(requestDir, 'methods');
const outputFile = join(requestDir, 'request.index.ts');

async function generateIndex() {
    try {
        // Read methods directory
        const methodFiles = await readdir(methodsDir);
        const methods = methodFiles
            .filter((f) => f.endsWith('.ts'))
            .map((f) => f.replace('.ts', ''));

        // Generate imports
        const methodImports = methods.map((name) => `import { ${name} } from './methods/${name}';`).join('\n');

        // Generate methods object
        const methodsObj = methods.map((name) => `  ${name}`).join(',\n');
        const methodsObjStr = `const methods = {\n${methodsObj}\n};`;

        // Generate the class
        const classCode = `// SPDX-License-Identifier: AGPL-3.0-only
// This file is auto-generated. Do not edit manually.
// Run: npm run generate:request-index

${methodImports}

${methodsObjStr}

export class PineRequest {
  private _cache = {};
  constructor(private context: any) {
    // Install methods
    Object.entries(methods).forEach(([name, factory]) => {
      this[name] = factory(context);
    });
  }
}

export default PineRequest;
`;

        await writeFile(outputFile, classCode, 'utf-8');
        console.log(`✅ Generated ${outputFile}`);
        console.log(`   - ${methods.length} methods: ${methods.join(', ')}`);
    } catch (error) {
        console.error('Error generating Request index:', error);
        process.exit(1);
    }
}

generateIndex();

