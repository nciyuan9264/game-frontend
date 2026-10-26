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
import YinshLobby from "@/features/yinsh/pages/Lobby";
import {
  Guide as YinshGuide,
  My as YinshMy,
  Rankings as YinshRankings,
} from "@/features/yinsh/pages/Community";
import OthelloLobby from "@/features/othello/pages/Lobby";
import {
  Guide as OthelloGuide,
  My as OthelloMy,
  Rankings as OthelloRankings,
} from "@/features/othello/pages/Community";
import QuoridorLobby from "@/features/quoridor/pages/Lobby";
import {
  Guide as QuoridorGuide,
  My as QuoridorMy,
  Rankings as QuoridorRankings,
} from "@/features/quoridor/pages/Community";
import FugitiveLobby from "@/features/fugitive/pages/Lobby";
import FugitiveGuide from "@/features/fugitive/pages/Guide";
import FugitiveCardLibrary from "@/features/fugitive/pages/CardLibrary";
import FugitiveRankings from "@/features/fugitive/pages/Rankings";
import FugitiveProfile from "@/features/fugitive/pages/Profile";
import WarChestLobby from "@/features/warchest/pages/Lobby";
import {
  Army as WarChestArmy,
  Guide as WarChestGuide,
  My as WarChestMy,
  Rankings as WarChestRankings,
} from "@/features/warchest/pages/Community";
import React, { lazy } from "react";
import { Navigate } from "react-router-dom";
const Home = lazy(() => import("@/features/home/pages/Home"));
const AcquireSession = lazy(() => import("@/features/acquire/pages/Session"));
const AcquireReplayPage = lazy(() => import("@/features/acquire/pages/Replay"));
const SplendorSession = lazy(() => import("@/features/splendor/pages/Session"));
const SplendorReplay = lazy(() => import("@/features/splendor/pages/Replay"));
const DavinciSession = lazy(() => import("@/features/davinci/pages/Session"));
const YinshSession = lazy(() => import("@/features/yinsh/pages/Session"));
const YinshReplay = lazy(() => import("@/features/yinsh/pages/Replay"));
const OthelloSession = lazy(() => import("@/features/othello/pages/Session"));
const OthelloReplay = lazy(() => import("@/features/othello/pages/Replay"));
const QuoridorSession = lazy(() => import("@/features/quoridor/pages/Session"));
const QuoridorReplay = lazy(() => import("@/features/quoridor/pages/Replay"));
const FugitiveSession = lazy(() => import("@/features/fugitive/pages/Session"));
const WarChestSession = lazy(() => import("@/features/warchest/pages/Session"));
const WarChestReplay = lazy(() => import("@/features/warchest/pages/Replay"));

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
    path: "/game/yinsh",
    element: <YinshLobby />
  },
  { path: "/game/yinsh/rankings", element: <YinshRankings /> },
  { path: "/game/yinsh/guide", element: <YinshGuide /> },
  { path: "/game/yinsh/me", element: <YinshMy /> },
  { path: "/game/yinsh/match", element: <YinshSession /> },
  { path: "/game/yinsh/replay/:gameId", element: <YinshReplay /> },
  {
    path: "/game/othello",
    element: <OthelloLobby />
  },
  { path: "/game/othello/rankings", element: <OthelloRankings /> },
  { path: "/game/othello/guide", element: <OthelloGuide /> },
  { path: "/game/othello/me", element: <OthelloMy /> },
  { path: "/game/othello/match", element: <OthelloSession /> },
  { path: "/game/othello/replay/:gameId", element: <OthelloReplay /> },
  {
    path: "/game/quoridor",
    element: <QuoridorLobby />
  },
  { path: "/game/quoridor/rankings", element: <QuoridorRankings /> },
  { path: "/game/quoridor/guide", element: <QuoridorGuide /> },
  { path: "/game/quoridor/me", element: <QuoridorMy /> },
  { path: "/game/quoridor/match", element: <QuoridorSession /> },
  { path: "/game/quoridor/replay/:gameId", element: <QuoridorReplay /> },
  {
    path: "/game/fugitive",
    element: <FugitiveLobby />
  },
  { path: "/game/fugitive/rankings", element: <FugitiveRankings /> },
  { path: "/game/fugitive/guide", element: <FugitiveGuide /> },
  { path: "/game/fugitive/cards", element: <FugitiveCardLibrary /> },
  { path: "/game/fugitive/me", element: <FugitiveProfile /> },
  { path: "/game/fugitive/match", element: <FugitiveSession /> },
  { path: "/game/warchest", element: <WarChestLobby /> },
  { path: "/game/warchest/army", element: <WarChestArmy /> },
  { path: "/game/warchest/rankings", element: <WarChestRankings /> },
  { path: "/game/warchest/guide", element: <WarChestGuide /> },
  { path: "/game/warchest/me", element: <WarChestMy /> },
  { path: "/game/warchest/match", element: <WarChestSession /> },
  { path: "/game/warchest/replay/:gameId", element: <WarChestReplay /> },
  {
    path: "/",
    element: <Home />
  },
  {
    path: "*",
    element: <Navigate to="/" replace />
  }
];
