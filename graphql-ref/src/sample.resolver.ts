import { Resolver,Args,Query,Mutation,ResolveField } from "@nestjs/graphql";
import { User } from "./graphql/graphql.js";
import { AppService } from "./app.service.js";

interface StructuredResponse<T> {
    message:string,
    data:T
}
@Resolver('User') 
export class UserResolver {
    constructor(private readonly appService:AppService) {}
    
    @Query()
    async user(@Args('id') id:string):Promise<User> {
        return await this.appService.findById(id);
    }
    @Query()
    async allUsers():Promise<User[]> {
        return await this.appService.findAllUsers()
    }
    @Mutation()
    async createUser(@Args('user') user:User):Promise<StructuredResponse<User>> {
        const data = await this.appService.createUser(user.name,user.email)
        return {message:'Successfully created the data',data:data}
    }   
}