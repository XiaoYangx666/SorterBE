import { mock } from "bun:test";

mock.module("@minecraft/server", () => import("./stubs/minecraft-server"));
mock.module("@minecraft/server-ui", () => import("./stubs/minecraft-server-ui"));
mock.module("sapi-pro", () => import("./stubs/sapi-pro"));
mock.module("sapi-pro/Deferred", () => import("./stubs/sapi-pro-deferred"));
mock.module("sapi-pro/func", () => import("./stubs/sapi-pro-func"));
mock.module("sapi-pro/Event", () => import("./stubs/sapi-pro-event"));
