import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { BirdsModule } from "./birds/birds.module";
import { ObservationsModule } from "./observations/observations.module";
import { AiModule } from "./ai/ai.module";
import { DatabaseModule } from "./database/database.module";
import { CommonModule } from "./common/common.module";
import { UploadsModule } from "./uploads/uploads.module";
import { NotificationModule } from "./notification/notification.module";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ".env",
        }),
        BirdsModule,
        ObservationsModule,
        AiModule,
        DatabaseModule,
        CommonModule,
        UploadsModule,
        //NotificationModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
