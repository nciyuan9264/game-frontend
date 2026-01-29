import { Route, Routes } from 'react-router-dom';
import { routes, AppRoute } from './routes.tsx';

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
                    route.element
                }
            >
                {route.children && renderRoutes(route.children)}
            </Route>
        ));
    };

    return <Routes>{renderRoutes(routes)}</Routes>;
};
