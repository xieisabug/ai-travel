import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("game", "routes/game.tsx"),
    route("worlds", "routes/worlds.tsx"),
    route("world-game", "routes/world-game.tsx"),
] satisfies RouteConfig;
