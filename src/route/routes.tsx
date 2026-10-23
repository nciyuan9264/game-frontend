import AcquireLobby from "@/features/acquire/pages/Lobby";
import {
  Guide as AcquireGuide,
  My as AcquireMy,
  Rankings as AcquireRankings,
} from "@/features/acquire/pages/Community";
import DavinciLobby from "@/features/davinci/pages/Lobby";
import {
  Guide as DavinciGuide,
  My as DavinciMy,
  Rankings as DavinciRankings,
} from "@/features/davinci/pages/Community";
import SplendorLobby from "@/features/splendor/pages/Lobby";
import {
  Guide as SplendorGuide,
  My as SplendorMy,
  Rankings as SplendorRankings,
} from "@/features/splendor/pages/Community";
import React, { lazy } from "react";
import { Navigate } from "react-router-dom";
const Home = lazy(() => import("@/features/home/pages/Home"));
const AcquireSession = lazy(() => import("@/features/acquire/pages/Session"));
const AcquireReplayPage = lazy(() => import("@/features/acquire/pages/Replay"));
const SplendorSession = lazy(() => import("@/features/splendor/pages/Session"));
const SplendorReplay = lazy(() => import("@/features/splendor/pages/Replay"));
const DavinciSession = lazy(() => import("@/features/davinci/pages/Session"));

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
