import fs from 'fs/promises';
import path from 'path';

try {
    (await fs.readdir('./dist/')).forEach(async file=>await fs.unlink(path.join('dist/',file)));
}catch {
    //
}