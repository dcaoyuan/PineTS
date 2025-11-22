// SPDX-License-Identifier: AGPL-3.0-only
import { readdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const arrayDir = join(__dirname, '../src/namespaces/array');
const methodsDir = join(arrayDir, 'methods');
const outputFile = join(arrayDir, 'array.index.ts');

async function generateIndex() {
    try {
        // Read methods directory
        const methodFiles = await readdir(methodsDir);
        const methods = methodFiles
            .filter((f) => f.endsWith('.ts'))
            .map((f) => {
                const name = f.replace('.ts', '');
                // Handle 'new' which is a reserved keyword - file is named 'new.ts' but exports as 'new_fn'
                return name === 'new' ? { file: name, export: 'new_fn', classProp: 'new' } : { file: name, export: name, classProp: name };
            });

        // Generate imports
        const methodImports = methods.map((m) => {
            if (m.file === 'new') {
                return `import { new_fn } from './methods/${m.file}';`;
            }
            return `import { ${m.export} } from './methods/${m.file}';`;
        }).join('\n');

        // Generate methods object - handle 'new' specially
        const methodsObj = methods.map((m) => {
            if (m.file === 'new') {
                return `  new: new_fn`;
            }
            return `  ${m.classProp}`;
        }).join(',\n');
        const methodsObjStr = `const methods = {\n${methodsObj}\n};`;

        // Generate the class
        const classCode = `// SPDX-License-Identifier: AGPL-3.0-only
// This file is auto-generated. Do not edit manually.
// Run: npm run generate:array-index

export { PineArrayObject } from './PineArrayObject';

${methodImports}

${methodsObjStr}

export class PineArray {
  private _cache = {};
  constructor(private context: any) {
    // Install methods
    Object.entries(methods).forEach(([name, factory]) => {
      this[name] = factory(context);
    });
  }
}

export default PineArray;
`;

        await writeFile(outputFile, classCode, 'utf-8');
        console.log(`✅ Generated ${outputFile}`);
        console.log(`   - ${methods.length} methods: ${methods.map(m => m.classProp).join(', ')}`);
    } catch (error) {
        console.error('Error generating Array index:', error);
        process.exit(1);
    }
}

generateIndex();

