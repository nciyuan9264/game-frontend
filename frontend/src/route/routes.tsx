import Game from "@/view/Game";
import Room from "@/view/Room";
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
    element: <Game />
  },
  {
    path: "/acquire/room/:roomID",
    element: <Room />
  },
  {
    path: "/",
    element: <Navigate to="/game/acquire" replace />
  },
  {
    path: "*",
    element: <Navigate to="/game/acquire" replace />
  }
];