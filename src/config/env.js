import { config } from "dotenv";
const envFile =
  process.env.NODE_ENV === "development"
    ? `.env.${process.env.NODE_ENV}`
    : ".env";
config({ path: envFile });
