import AcquireLobby from "@/features/acquire/pages/Lobby";
import React, { lazy } from "react";
import { Navigate } from "react-router-dom";
const Home = lazy(() => import("@/features/home/pages/Home"));
const AcquireSession = lazy(() => import("@/features/acquire/pages/Session"));
const AcquireReplayPage = lazy(() => import("@/features/acquire/pages/Replay"));
const SplendorLobby = lazy(() => import("@/features/splendor/pages/Lobby"));
const SplendorSession = lazy(() => import("@/features/splendor/pages/Session"));
const SplendorReplay = lazy(() => import("@/features/splendor/pages/Replay"));
const SplendorRankings = lazy(() => import("@/features/splendor/pages/Community").then(module => ({ default: module.Rankings })));
const SplendorGuide = lazy(() => import("@/features/splendor/pages/Community").then(module => ({ default: module.Guide })));
const SplendorMy = lazy(() => import("@/features/splendor/pages/Community").then(module => ({ default: module.My })));
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
    element: <AcquireSession />
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
    element: <SplendorLobby />
  },
  { path: "/game/splendor/rankings", element: <SplendorRankings /> },
  { path: "/game/splendor/guide", element: <SplendorGuide /> },
  { path: "/game/splendor/me", element: <SplendorMy /> },
  { path: "/game/splendor/match", element: <SplendorSession /> },
  { path: "/game/splendor/replay/:gameId", element: <SplendorReplay /> },
  {
    path: "/",
    element: <Home />
  },
  {
    path: "*",
    element: <Navigate to="/" replace />
  }
];
