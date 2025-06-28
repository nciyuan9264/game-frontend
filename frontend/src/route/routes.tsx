import AcquireGame from "@/view/Acquire/GameBoard";
import AcquireRoom from "@/view/Acquire/Room";
import Home from "@/view/Home";
import SplendorGame from "@/view/Splendor/GameBoard";
import SplendorRoom from "@/view/Splendor/Room";

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
    element: <AcquireGame />
  },
  {
    path: "/acquire/room/:roomID",
    element: <AcquireRoom />
  },
  {
    path: "/game/splendor",
    element: <SplendorGame />
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