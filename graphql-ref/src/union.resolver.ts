import { Resolver,ResolveField,Mutation,Args} from "@nestjs/graphql";
import { AppService } from "./app.service.js";
import { CreateUserResponse,User,Sample,Apple} from "./graphql/graphql.js";

@Resolver('CreateUserResponse')//👈
export class ResultUnionResolver {
    constructor(private readonly appService:AppService) {}

    @Mutation()//*This
    async createUser(@Args() user:User):Promise<CreateUserResponse> {//👈
        const data = await this.appService.createUser(user.name,user.email)
        return {message:'Successfully created the data',data:data,energy:'h'}//👈
    }
    @ResolveField()
    __resolveType(value:any) {
        if (value.energy) {
            return 'Apple';
        }else {
            return 'Sample';
        }
    }
}
