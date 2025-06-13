
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthRouteProps {
    children: React.ReactNode;
    auth?: boolean;
}

/**
 * 认证路由
 * @param children  子组件
 * @param auth  是否需要认证
 * @constructor 认证路由组件
 */
const AuthRoute: React.FC<AuthRouteProps> = ({ children, auth }) => {
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const data = await check();
                if (data.data.message === '已认证') {
                    return;
                }
            } catch (err) {
                console.error('认证检查失败:', err);
                navigate('/medicine/edit');
            }
            // 如果后端返回 401，则跳转到登录页
        };
        if (auth) {
            checkAuth();
        }
    }, [navigate]);

    return <>{children}</>;
};

export default AuthRoute;
