import DaVinci from "@/view/DaVinci";
import Acquire from "@/view/Acquire";
import AcquireLobby from "@/features/acquire/pages/Lobby";
import React, { lazy } from "react";
import { Navigate } from "react-router-dom";
const Home = lazy(() => import("@/view/Home"));
const GameBoard = lazy(() => import("@/view/GameBoard"));
const AcquireReplayPage = lazy(() => import("@/features/acquire/pages/Replay"));
const Splendor = lazy(() => import("@/view/Splendor"));
const AcquireRankings = lazy(() => import("@/features/acquire/pages/Community").then(module => ({ default: module.Rankings })));
const AcquireGuide = lazy(() => import("@/features/acquire/pages/Community").then(module => ({ default: module.Guide })));
const AcquireMy = lazy(() => import("@/features/acquire/pages/Community").then(module => ({ default: module.My })));

export interface AppRoute {
  path: string;
  element: React.ReactNode;
  auth?: boolean;
  children?: AppRoute[];
}

export const routes: AppRoute[] = [
  {
    path: "/game/acquire",
    element: <AcquireLobby />
  },
  { path: "/game/acquire/rankings", element: <AcquireRankings /> },
  { path: "/game/acquire/guide", element: <AcquireGuide /> },
  { path: "/game/acquire/me", element: <AcquireMy /> },
  {
    path: "/game/acquire/match",
    element: <Acquire />
  },
  {
    path: "/game/acquire/replay/:gameId",
    element: <AcquireReplayPage />
  },
  {
    path: "/game/davinci",
    element: <GameBoard />
  },
  {
    path: "/game/davinci/match",
    element: <DaVinci />
  },
  {
    path: "/game/splendor",
    element: <GameBoard />
  },
  {
    path: "/game/splendor/match",
    element: <Splendor />
  },
  {
    path: "/",
    element: <Home />
  },
  {
    path: "*",
    element: <Navigate to="/" replace />
  }
];
