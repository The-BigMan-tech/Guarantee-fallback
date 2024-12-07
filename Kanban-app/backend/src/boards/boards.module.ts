import { Module } from "@nestjs/common";
import { CreateBoardModule } from "./creating-a-board/create-board.module";
@Module({
    imports:[CreateBoardModule],
})
export class BoardModule {

}