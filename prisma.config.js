"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const config_1 = require("prisma/config");
dotenv_1.default.config();
exports.default = (0, config_1.defineConfig)({
    schema: "prisma/schema.prisma",
    datasource: {
        url: (0, config_1.env)("DATABASE_URL"),
    },
    migrations: {
        seed: "tsx prisma/seed.ts",
    },
});
