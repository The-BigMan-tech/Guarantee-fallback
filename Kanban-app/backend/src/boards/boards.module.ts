import { Module } from "@nestjs/common";
import { CreateBoardModule } from "./creating-a-board/create-board.module";
import { LoadBoardModule } from "./loading-boards/loadBoards.module";

@Module({
    imports:[CreateBoardModule,LoadBoardModule],
})
export class BoardModule {

}