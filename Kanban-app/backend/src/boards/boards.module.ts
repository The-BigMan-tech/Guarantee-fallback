import { Module } from "@nestjs/common";
import { CreateBoardModule } from "./create-a-board/create-board.module";
import { LoadBoardModule } from "./load-my-boards/loadBoards.module";
import { DeleteBoardModule } from "./delete-a-board/delete-board.module";
import { CommonServicesModule } from "./common-services/common-services.module";
import { SelectBoardModule } from "./select-a-board/select-board.module";
import { EditBoardModule } from "./edit-board-name/edit-board-name.module";

@Module({
    imports:[CommonServicesModule,CreateBoardModule,LoadBoardModule,DeleteBoardModule,SelectBoardModule,EditBoardModule],
})
export class BoardModule {

}