import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { RenderRoutes } from './route/render-routes';
import { initApi } from './api';
import './styles/fonts.css';
import './index.css';

initApi();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter basename="/">
            <RenderRoutes />
        </BrowserRouter>
    </React.StrictMode>,
)
