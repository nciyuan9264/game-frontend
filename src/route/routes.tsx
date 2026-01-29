import GameBoard from "@/view/GameBoard";
import AcquireRoom from "@/view/Acquire";
import Home from "@/view/Home";
// import SplendorGame from "@/view/Splendor/GameBoard";
import SplendorRoom from "@/view/Splendor";

import React from "react";
import { Navigate } from "react-router-dom";

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
    path: "/acquire/room/:roomID",
    element: <AcquireRoom />
  },
  {
    path: "/game/splendor",
    element: < GameBoard/>
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