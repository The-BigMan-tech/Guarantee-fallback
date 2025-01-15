import { Injectable } from '@nestjs/common';
import { User } from './graphql/graphql.js';

@Injectable()
export class AppService {
  private users:User[] = [
    {id:'1',name:'person',email:'random'}
  ]
  public async findById(id:string):Promise<User> {
    return this.users.find(user=>user.id === id) as User
  }
}
