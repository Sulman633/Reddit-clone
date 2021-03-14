"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = require("./entities/User");
const constants_1 = require("./constants");
const Post_1 = require("./entities/Post");
const path_1 = __importDefault(require("path"));
exports.default = {
    migrations: {
        path: path_1.default.join(__dirname, "./migrations"),
        pattern: /^[\w-]+\d+\.[tj]s$/,
    },
    dbName: "Reddit-Clone",
    user: "Sulman",
    password: "kb24forlife",
    debug: !constants_1.__prod__,
    type: "postgresql",
    entities: [Post_1.Post, User_1.User]
};
//# sourceMappingURL=mikro-orm.config.js.map