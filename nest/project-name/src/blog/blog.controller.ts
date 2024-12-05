/* eslint-disable prettier/prettier */
import {Controller,Post,Body,UsePipes, UseGuards, UseInterceptors,Get} from '@nestjs/common';
import { CommentPipe } from './comment.pipe';
import {commentDtoClass} from './comment';
import { ClassPipe } from './comment.pipe';
import { commentClass } from './comment';
import { BlogGuard } from './blog.guard';
import { blogInterceptor } from './blog.interceptor';
import { BlogService } from './blog.service';

interface sampleInterface {
    email:unknown,
    comment:unknown
}
let sample:sampleInterface;
console.log(sample);

@Controller('blog')
@UseGuards(new BlogGuard())
export class BlogController {
    constructor(private readonly blogService:BlogService) {
        //No implementation
    }
    @Get('getDoc')
    public getDB() {
        this.blogService.create({name:'me',age:10})
        return this.blogService.findBlogs();
    }

    @Post('postComment')
    @UsePipes(new CommentPipe())
    public postComment(@Body() body:commentDtoClass):string {
        return `Posted the comment ${body.comment}`
    }
    
    @Post('postSomething')
    @UsePipes(new ClassPipe())
    @UseInterceptors(new blogInterceptor())
    public postSomething(@Body() body:commentClass) {
        return `${body.username} posted some data`
    }
}