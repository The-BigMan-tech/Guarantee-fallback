import { Module } from "@nestjs/common";
import { CreateBoardModule } from "./creating-a-board/create-board.module";
import { LoadBoardModule } from "./load-boards/loadBoards.module";
import { DeleteBoardModule } from "./deleting-a-board/delete-board.module";
import { CommonServicesModule } from "./common-services/common-services.module";
import { SelectBoardModule } from "./selecting-a-board/select-board.module";

@Module({
    imports:[CommonServicesModule,CreateBoardModule,LoadBoardModule,DeleteBoardModule,SelectBoardModule],
})
export class BoardModule {

}