import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { RenderRoutes } from './route/render-routes';
import { installGameNavigationGuard } from './features/game-core/model/navigationGuard';
import { initApi } from './api';
import './index.css';

installGameNavigationGuard();
initApi();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter basename="/">
            <RenderRoutes />
        </BrowserRouter>
    </React.StrictMode>,
)
