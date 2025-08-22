import chokidar from 'chokidar';
import { exec } from 'child_process';
import { throttle } from 'throttle-debounce';

const compileThrottlers = new Map<string, ReturnType<typeof throttle>>();

// Initialize watcher.
const watcher = chokidar.watch('src', {
    persistent: true,
    ignoreInitial: true,    // don't fire events for files already present on start
    awaitWriteFinish: true, // wait for writes to finish before emitting events
    ignored: /(^|[/\\])\../, // ignore dotfiles like .git etc.
    depth: 99               // watch subdirectories recursively (adjust depth as needed)
});

function compile(filePath:string) {
    const cmd = `pnpm exec swc ${filePath} -d build`;
    exec(cmd, (err, _stdout, stderr) => {
        if (err) {
            console.error(`Error compiling ${filePath}:`, stderr);
        } else {
            console.log(`Compiled ${filePath} successfully.`);
            console.log('Watching `src` folder for changes...');
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

watcher.on('change', (filePath) => {
    console.log('Detected file change:', filePath);
    getThrottledCompile(filePath)();
});

watcher.on('add', (filePath) => {
    console.log('Detected an added file:', filePath);
    getThrottledCompile(filePath)();
});
console.log('Watching `src` folder for changes...');
