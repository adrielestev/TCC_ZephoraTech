import knex from "knex";
import config from "../../knexfile.js";
import { env } from "../config/env.js";

const environment = env.NODE_ENV === "production" ? "production" : "development";

export const db = knex(config[environment]);
