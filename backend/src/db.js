import knex from "knex";
import knexfile from "../knexfile.js";

const environment = process.env.NODE_ENV || "development";
const config = knexfile[environment];

if (!config) {
  throw new Error(`Ambiente de banco de dados desconhecido: ${environment}`);
}

export const db = knex(config);
