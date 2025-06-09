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
    path: "/game",
    element: <Game />
  },
  {
    path: "/room/:roomID",
    element: <Room />
  },
  {
    path: "/",
    element: <Navigate to="/game" replace />
  },
  {
    path: "*",
    element: <Navigate to="/game" replace />
  }
];