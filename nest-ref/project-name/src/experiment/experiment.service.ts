/* eslint-disable prettier/prettier */
import { Injectable } from "@nestjs/common";

@Injectable()
export class experimentService { 
    private readonly storage:string[] = []

    public store(data:string):void {
        this.storage.push(data)
    }
    public returnStorage():string[] {
        return this.storage
    }
}
