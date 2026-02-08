import GameBoard from "@/view/GameBoard";
import Home from "@/view/Home";
// import SplendorGame from "@/view/Splendor/GameBoard";
import SplendorRoom from "@/view/Splendor";

import React from "react";
import { Navigate } from "react-router-dom";
import { Acquire } from "@/view/Acquire";

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