import { Resolver,Args,Query,Mutation,ResolveField} from "@nestjs/graphql";
import { User,Sample,Apple,CreateUserResponse} from "./graphql/graphql.js";
import { AppService } from "./app.service.js";

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
}
