import {watch} from 'chokidar'
import { GraphQLDefinitionsFactory } from '@nestjs/graphql';
import { join } from 'path';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const definitionsFactory = new GraphQLDefinitionsFactory();
const watchPath = `${__dirname}/*.graphql`
const watcher = watch(watchPath,{persistent:true})

watcher.on('change',async ()=>{
    await definitionsFactory.generate({
        typePaths: [watchPath],
        path: join(__dirname, './graphql.ts'),
        watch:true
    });
});
