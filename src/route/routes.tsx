
import React, { lazy } from "react";
import { Navigate } from "react-router-dom";
const Home = lazy(() => import("@/view/Home"));
const GameBoard = lazy(() => import("@/view/GameBoard"));
const SplendorRoom = lazy(() => import("@/view/Splendor"));
const Acquire = lazy(() => import("@/view/Acquire"));

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
    path: "/game/splendor",
    element: <GameBoard />
  },
  {
    path: "/splendor/room/:roomID",
    element: <SplendorRoom />
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