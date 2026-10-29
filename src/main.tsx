import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GameAudio } from './components/GameUI/GameAudio';
import { RenderRoutes } from './route/render-routes';
import { initApi } from './api';
import './styles/fonts.css';
import './index.css';

initApi();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter basename="/">
            <RenderRoutes />
            <GameAudio />
        </BrowserRouter>
    </React.StrictMode>,
)
