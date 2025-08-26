import { importDoc } from './fact-checker/fact-checker.js';
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);
const parentDirFromSrc = _dirname.replace('\\build','');

const doc = await importDoc(path.join(parentDirFromSrc,'./doc.el'),parentDirFromSrc);
if (!doc) process.exit(0);