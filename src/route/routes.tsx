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
const DavinciLobby = lazy(() => import("@/features/davinci/pages/Lobby"));
const DavinciSession = lazy(() => import("@/features/davinci/pages/Session"));
const DavinciRankings = lazy(() => import("@/features/davinci/pages/Community").then(module => ({ default: module.Rankings })));
const DavinciGuide = lazy(() => import("@/features/davinci/pages/Community").then(module => ({ default: module.Guide })));
const DavinciMy = lazy(() => import("@/features/davinci/pages/Community").then(module => ({ default: module.My })));

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
    element: <DavinciLobby />
  },
  { path: "/game/davinci/rankings", element: <DavinciRankings /> },
  { path: "/game/davinci/guide", element: <DavinciGuide /> },
  { path: "/game/davinci/me", element: <DavinciMy /> },
  {
    path: "/game/davinci/match",
    element: <DavinciSession />
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
