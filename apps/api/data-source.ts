import { DataSource } from "typeorm";
import * as dotenv from "dotenv";

dotenv.config();

export default new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5433", 10),
  username: process.env.DB_USERNAME || "idol",
  password: process.env.DB_PASSWORD || "idol_secret",
  database: process.env.DB_DATABASE || "idol_championship",
  entities: ["src/**/*.entity.ts"],
  migrations: ["src/migrations/*.ts"],
});
