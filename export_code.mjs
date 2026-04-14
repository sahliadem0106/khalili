/**
 * Export script — generates two separate txt files:
 *   1. frontend_export.txt  — src/, config files, rules
 *   2. backend_export.txt   — functions/ (Cloud Functions)
 *
 * Usage: node export_code.mjs
 */

import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const excludeDirs = ['node_modules', 'dist', '.git', 'assets', 'animations', '.gemini'];
const includeExts = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.html'];
const skipFiles = ['package-lock.json', 'quran-full.ts']; // skip huge data files

// -----------------------------------------------------------------
// Shared traversal utility
// -----------------------------------------------------------------
function collectFiles(dir, rootBase) {
    let output = '';
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!excludeDirs.includes(file)) {
                output += collectFiles(fullPath, rootBase);
            }
        } else {
            const ext = path.extname(file);
            if (includeExts.includes(ext) && !skipFiles.includes(file)) {
                const relativePath = path.relative(rootBase, fullPath);
                try {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    output += `\n\n${'='.repeat(65)}\n`;
                    output += `FILE: ${relativePath}\n`;
                    output += `${'='.repeat(65)}\n\n`;
                    output += content;
                } catch (e) {
                    console.error(`Failed to read ${fullPath}`, e);
                }
            }
        }
    }
    return output;
}

function appendFile(filePath, rootBase) {
    if (!fs.existsSync(filePath)) return '';
    const relativePath = path.relative(rootBase, filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    let out = `\n\n${'='.repeat(65)}\n`;
    out += `FILE: ${relativePath}\n`;
    out += `${'='.repeat(65)}\n\n`;
    out += content;
    return out;
}

// -----------------------------------------------------------------
// 1. FRONTEND EXPORT
// -----------------------------------------------------------------
let frontend = '// KHALILI — FRONTEND EXPORT\n// Generated: ' + new Date().toISOString() + '\n';

// src/ directory (excluding data/quran-full.ts)
const srcDir = path.join(rootDir, 'src');
if (fs.existsSync(srcDir)) {
    frontend += collectFiles(srcDir, rootDir);
}

// Root config files
const frontendConfigs = [
    'package.json', 'vite.config.ts', 'tailwind.config.js', 'tsconfig.json',
    'postcss.config.js', 'index.html',
    'firebase.json', 'firestore.rules', 'firestore.indexes.json',
    '.env.example',
];
for (const file of frontendConfigs) {
    frontend += appendFile(path.join(rootDir, file), rootDir);
}

fs.writeFileSync(path.join(rootDir, 'frontend_export.txt'), frontend);
console.log(`✅ frontend_export.txt — ${(Buffer.byteLength(frontend) / 1024).toFixed(0)} KB`);

// -----------------------------------------------------------------
// 2. BACKEND EXPORT
// -----------------------------------------------------------------
let backend = '// KHALILI — BACKEND EXPORT (Cloud Functions)\n// Generated: ' + new Date().toISOString() + '\n';

const functionsDir = path.join(rootDir, 'functions');
if (fs.existsSync(functionsDir)) {
    backend += collectFiles(functionsDir, rootDir);
}

// Also include Firestore rules/indexes in backend for reference
backend += appendFile(path.join(rootDir, 'firestore.rules'), rootDir);
backend += appendFile(path.join(rootDir, 'firestore.indexes.json'), rootDir);
backend += appendFile(path.join(rootDir, 'firebase.json'), rootDir);

fs.writeFileSync(path.join(rootDir, 'backend_export.txt'), backend);
console.log(`✅ backend_export.txt  — ${(Buffer.byteLength(backend) / 1024).toFixed(0)} KB`);
