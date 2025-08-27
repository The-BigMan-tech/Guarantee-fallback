import chokidar from 'chokidar';
import { exec } from 'child_process';
import { throttle } from 'throttle-debounce';
import { unlink } from 'fs/promises';
import path from 'path';
import chalk from "chalk";

const compileThrottlers = new Map<string, ReturnType<typeof throttle>>();

// Initialize watcher.
const watcher = chokidar.watch('src', {
    persistent: true,
    ignoreInitial: true,    // don't fire events for files already present on start
    awaitWriteFinish: true, // wait for writes to finish before emitting events
    ignored: /(^|[/\\])\../, // ignore dotfiles like .git etc.
    depth: 99               // watch subdirectories recursively (adjust depth as needed)
});
function done() {
    console.log(`${chalk.blue('Watching')} 'src' folder for changes...`);
}

function compile(filePath:string) {
    const cmd = `pnpm exec swc ${filePath} -d build`;
    exec(cmd, (err, _stdout, stderr) => {
        if (err) {
            console.error(` ${chalk.red('Error: ')}Failed to compile: ${filePath},${stderr}`);
        } else {
            console.log(`${chalk.green('Compiled')} ${filePath} successfully.`);
            done();
        }
    });
}
const newThrottleCompile = (filePath:string)=> throttle(1000,() =>compile(filePath)
	,{ noLeading:true, noTrailing: false }
);
function getThrottledCompile(filePath: string) {
    if (!compileThrottlers.has(filePath)) {
        compileThrottlers.set(filePath,newThrottleCompile(filePath));
    }
    return compileThrottlers.get(filePath);
}

async function deleteBuildFile(filePath: string) {
    try {
        const buildPathFromSrc = path.parse(path.join('build',filePath))
        const buildPath = path.join(buildPathFromSrc.dir,`${buildPathFromSrc.name}.js`);
        const buildMapPath = buildPath.concat('.map')
        compileThrottlers.delete(filePath);
        await unlink(buildPath);
        await unlink(buildMapPath);
        console.log(`${chalk.red('Deleted')} build file: ${buildPath}`);
        done();
    }catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
            console.log(`${chalk.red('Build file or map already deleted or missing.')}`);
        } else {
            console.error(`${chalk.red('Failed to delete build file:')},${err}`);
        }
    }
}

watcher.on('unlink', (filePath) => {//the filepath here is relative
    console.log(`${chalk.yellow('Detected')} a deleted file at: ${filePath}`);
    deleteBuildFile(filePath);
});
watcher.on('change', (filePath) => {
    console.log(`${chalk.yellow('Detected')} file change at: ${filePath}`);
    getThrottledCompile(filePath)();
});
watcher.on('add', (filePath) => {
    console.log(`${chalk.yellow('Detected')} a new file at: ${filePath}`);
    getThrottledCompile(filePath)();
});
done();
