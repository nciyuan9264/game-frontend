import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GameAudio } from './components/GameUI/GameAudio';
import { AcquisitionSurveyPrompt } from './features/acquisition-survey/AcquisitionSurveyPrompt';
import { ResultShareFontWarmup } from './features/game-core/result-share/ResultShareFontWarmup';
import { RenderRoutes } from './route/render-routes';
import { initApi } from './api';
import './styles/fonts.css';
import './styles/game-mobile-layout.css';
import './index.css';

async function bootstrap() {
    initApi();
    const params = new URLSearchParams(window.location.search);
    const preview = import.meta.env.DEV && params.get('__preview') === '1';
    if (preview) {
        const { installGamePreviewEnvironment } = await import(
            './features/dev-preview/setup'
        );
        installGamePreviewEnvironment();
    }
    const PreviewControls = preview && params.get('controls') !== '0'
        ? (await import('./features/dev-preview/Controls')).default
        : undefined;

    ReactDOM.createRoot(document.getElementById('root')!).render(
        <React.StrictMode>
            <BrowserRouter basename="/">
                <ResultShareFontWarmup />
                <AcquisitionSurveyPrompt />
                <RenderRoutes />
                <GameAudio />
                {PreviewControls && <PreviewControls />}
            </BrowserRouter>
        </React.StrictMode>,
    );
}

void bootstrap();
