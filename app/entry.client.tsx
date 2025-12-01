/**
 * SPA 客户端入口
 * 由于使用 ssr: false，这个文件用于纯客户端渲染
 */

import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

hydrateRoot(document, <HydratedRouter />);
