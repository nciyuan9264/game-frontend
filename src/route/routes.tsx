import DaVinci from "@/view/DaVinci";
import React, { lazy } from "react";
import { Navigate } from "react-router-dom";
const Home = lazy(() => import("@/view/Home"));
const GameBoard = lazy(() => import("@/view/GameBoard"));
const Acquire = lazy(() => import("@/view/Acquire"));
const AcquireReplayPage = lazy(() => import("@/view/Acquire/Replay/page"));
const Splendor = lazy(() => import("@/view/Splendor"));

export interface AppRoute {
  path: string;
  element: React.ReactNode;
  auth?: boolean;
  children?: AppRoute[];
}

export const routes: AppRoute[] = [
  {
    path: "/game/acquire",
    element: <GameBoard />
  },
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