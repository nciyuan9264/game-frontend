import { Route, Routes } from 'react-router-dom';
import { routes, AppRoute } from './routes.tsx';
import { Suspense } from 'react';
import { LoadingBlock } from '@/components/LoadingBlock/index.tsx';
import { AcquireLoading } from '@/features/acquire/components/LoadingState';
import { AcquireSessionLoading } from '@/features/acquire/pages/Session/Loading';
import { DavinciLoading } from '@/features/davinci/components/LoadingState';
import { SplendorLoading } from '@/features/splendor/components/LoadingState';
import { YinshLoading } from '@/features/yinsh/components/LoadingState';
import { OthelloLoading } from '@/features/othello/components/LoadingState';
import { OthelloSessionLoading } from '@/features/othello/pages/Session/Loading';
import { QuoridorLoading } from '@/features/quoridor/components/LoadingState';
import { OnitamaLoading } from '@/features/onitama/components/LoadingState';
import { FugitiveLoading } from '@/features/fugitive/components/LoadingState';
import { Loading as WarChestLoading } from '@/features/warchest/components/Shell';
import { LoveLetterLoading } from '@/features/loveletter/components/LoadingState';
import { SixNimmtLoading } from '@/features/sixnimmt/components/LoadingState';

/**
 * 渲染路由
 * @constructor RenderRoutes
 */
export const RenderRoutes = () => {
    const renderRoutes = (routes: AppRoute[]) => {
        return routes.map(route => {
            const fallback = route.path === '/game/acquire/match'
                ? <AcquireSessionLoading />
                : route.path.startsWith('/game/acquire')
                ? <AcquireLoading fullScreen title="正在进入午夜董事会。" description="正在准备城市与牌桌资源" />
                : route.path.startsWith('/game/davinci')
                    ? <DavinciLoading fullScreen />
                    : route.path.startsWith('/game/splendor')
                        ? <SplendorLoading fullScreen />
                        : route.path.startsWith('/game/yinsh')
                            ? <YinshLoading fullScreen />
                            : route.path === '/game/othello/match'
                                ? <OthelloSessionLoading />
                            : route.path.startsWith('/game/othello')
                                ? <OthelloLoading fullScreen />
                                : route.path.startsWith('/game/quoridor')
                                    ? <QuoridorLoading fullScreen />
                                : route.path.startsWith('/game/onitama')
                                    ? <OnitamaLoading fullScreen />
                                : route.path.startsWith('/game/fugitive')
                                    ? <FugitiveLoading fullScreen />
                                    : route.path.startsWith('/game/warchest')
                                        ? <div className="warchest-root"><WarChestLoading text="正在进入战争之匣。" /></div>
                                    : route.path.startsWith('/game/loveletter')
                                        ? <LoveLetterLoading fullScreen title="正在拆开掌心密信。" description="正在准备庭院与角色牌" />
                        : route.path.startsWith('/game/sixnimmt')
                                        ? <SixNimmtLoading fullScreen title="正在进入牧场牌桌。" description="正在准备数字牌与在线玩家" />
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
