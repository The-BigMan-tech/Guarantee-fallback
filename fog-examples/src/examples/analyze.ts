import { analyzeDocument, lspAnalysis } from "fog-js";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from "fs/promises";

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);
const parentDirFromSrc = _dirname.replace('\\build','');

const srcFilePath = path.join(parentDirFromSrc,'./documents/doc.fog');
const srcText = await fs.readFile(srcFilePath, 'utf8');

const analysis:lspAnalysis = await analyzeDocument(srcText,srcFilePath);
console.log("Analysis: ",analysis,analysis.diagnostics.length);
