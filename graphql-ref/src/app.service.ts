import { Injectable } from '@nestjs/common';
import { User } from './graphql/graphql.js';

@Injectable()
export class AppService {
  private defaultId = 1
  private users:User[] = [
    {id:'1',name:'person',email:'random'}
  ]
  public async findById(id:string):Promise<User> {
    return this.users.find(user=>user.id === id) as User
  }
  public async findAllUsers():Promise<User[]> {
    return this.users
  }
  public async createUser(name:string,email:string):Promise<User> {
    const user = {
      id:String(++this.defaultId),
      name:name,
      email:email
    }
    this.users.push(user)
    return user
  }
}
