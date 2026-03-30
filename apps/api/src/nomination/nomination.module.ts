import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Nomination } from "./nomination.entity";
import { NominationService } from "./nomination.service";
import { NominationController } from "./nomination.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Nomination])],
  controllers: [NominationController],
  providers: [NominationService],
  exports: [NominationService],
})
export class NominationModule {}
