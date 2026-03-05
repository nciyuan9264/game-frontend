import { Route, Routes } from 'react-router-dom';
import { routes, AppRoute } from './routes.tsx';
import { Suspense } from 'react';
import { LoadingBlock } from '@/components/LoadingBlock/index.tsx';

/**
 * 渲染路由
 * @constructor RenderRoutes
 */
export const RenderRoutes = () => {
    const renderRoutes = (routes: AppRoute[]) => {
        return routes.map(route => (
            <Route
                key={route.path}
                path={route.path}
                element={
                    <Suspense fallback={<LoadingBlock />}>
                        {route.element}
                    </Suspense>
                }
            >
                {route.children && renderRoutes(route.children)}
            </Route>
        ));
    };

    return <Routes>{renderRoutes(routes)}</Routes>;
};
