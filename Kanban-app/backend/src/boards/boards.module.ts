import { Module } from "@nestjs/common";
import { CreateBoardModule } from "./creating-a-board/create-board.module";
import { LoadBoardModule } from "./loading-boards/loadBoards.module";
import { DeleteBoardModule } from "./deleting-a-board/delete-board.module";

@Module({
    imports:[CreateBoardModule,LoadBoardModule,DeleteBoardModule],
})
export class BoardModule {

}