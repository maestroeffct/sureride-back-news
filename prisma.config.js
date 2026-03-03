const dotenv = require("dotenv");
const { defineConfig, env } = require("prisma/config");

dotenv.config();

module.exports = defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
