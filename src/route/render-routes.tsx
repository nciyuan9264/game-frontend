import { Route, Routes } from 'react-router-dom';
import { routes, AppRoute } from './routes.tsx';
import { Suspense } from 'react';
import { LoadingBlock } from '@/components/LoadingBlock/index.tsx';
import { AcquireLoading } from '@/features/acquire/components/LoadingState';
import { DavinciLoading } from '@/features/davinci/components/LoadingState';
import { SplendorLoading } from '@/features/splendor/components/LoadingState';
import { YinshLoading } from '@/features/yinsh/components/LoadingState';

/**
 * 渲染路由
 * @constructor RenderRoutes
 */
export const RenderRoutes = () => {
    const renderRoutes = (routes: AppRoute[]) => {
        return routes.map(route => {
            const fallback = route.path.startsWith('/game/acquire')
                ? <AcquireLoading fullScreen title="正在进入午夜董事会。" description="正在准备城市与牌桌资源" />
                : route.path.startsWith('/game/davinci')
                    ? <DavinciLoading fullScreen />
                    : route.path.startsWith('/game/splendor')
                        ? <SplendorLoading fullScreen />
                        : route.path.startsWith('/game/yinsh')
                            ? <YinshLoading fullScreen />
                        : <LoadingBlock />;
            return (
                <Route
                    key={route.path}
                    path={route.path}
                    element={
                        <Suspense fallback={fallback}>
                            {route.element}
                        </Suspense>
                    }
                >
                    {route.children && renderRoutes(route.children)}
                </Route>
            );
        });
    };

    return <Routes>{renderRoutes(routes)}</Routes>;
};
