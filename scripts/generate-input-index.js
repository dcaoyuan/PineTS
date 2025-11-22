// SPDX-License-Identifier: AGPL-3.0-only
import { readdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const inputDir = join(__dirname, '../src/namespaces/input');
const methodsDir = join(inputDir, 'methods');
const outputFile = join(inputDir, 'input.index.ts');

async function generateIndex() {
    try {
        // Read methods directory
        const methodFiles = await readdir(methodsDir);
        const methods = methodFiles
            .filter((f) => f.endsWith('.ts'))
            .map((f) => {
                const name = f.replace('.ts', '');
                // Handle 'enum' which is a reserved keyword - file exports 'enum_fn'
                return name === 'enum' ? { file: name, export: 'enum_fn', classProp: 'enum' } : { file: name, export: name, classProp: name };
            });

        // Generate imports
        const methodImports = methods.map((m) => {
            if (m.file === 'enum') {
                return `import { enum_fn } from './methods/${m.file}';`;
            }
            return `import { ${m.export} } from './methods/${m.file}';`;
        }).join('\n');

        // Generate methods object - handle 'enum' specially
        const methodsObj = methods.map((m) => {
            if (m.file === 'enum') {
                return `  enum: enum_fn`;
            }
            return `  ${m.classProp}`;
        }).join(',\n');
        const methodsObjStr = `const methods = {\n${methodsObj}\n};`;

        // Generate the class
        const classCode = `// SPDX-License-Identifier: AGPL-3.0-only
// This file is auto-generated. Do not edit manually.
// Run: npm run generate:input-index

export type { InputOptions } from './types';

${methodImports}

${methodsObjStr}

//in the current implementation we just declare the input interfaces for compatibility
// in future versions this might be used for visualization
export class Input {
  constructor(private context: any) {
    // Install methods
    Object.entries(methods).forEach(([name, factory]) => {
      this[name] = factory(context);
    });
  }
}

export default Input;
`;

        await writeFile(outputFile, classCode, 'utf-8');
        console.log(`✅ Generated ${outputFile}`);
        console.log(`   - ${methods.length} methods: ${methods.map(m => m.classProp).join(', ')}`);
    } catch (error) {
        console.error('Error generating Input index:', error);
        process.exit(1);
    }
}

generateIndex();

