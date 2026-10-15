import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { RenderRoutes } from './route/render-routes';
import { installAcquireNavigationGuard } from './features/acquire/model/navigationGuard';
import './index.css';

installAcquireNavigationGuard();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter basename="/">
            <RenderRoutes />
        </BrowserRouter>
    </React.StrictMode>,
)
