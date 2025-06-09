import React from "react";
import { TabBar } from "antd-mobile";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { AllApplication, HomeTwo, Calendar, User } from "@icon-park/react";
import useI18n from "@/hooks/i18n.ts";
import "./index.less";
import { usePersonStore } from "@/store/config";
import { rootFontSize } from "@/const/env";

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const { env } = usePersonStore();
  const t = useI18n();
  const location = useLocation();
  const { pathname } = location;
  const [activeKey, setActiveKey] = React.useState(pathname);
  const tabs = [
    {
      key: "/",
      title: t("首页"),
      icon:
        activeKey === "/" ? (
          <HomeTwo theme="two-tone" size="22" fill={["#000", "#000"]} />
        ) : (
          <HomeTwo size="22" />
        ),
    },
    {
      key: "/wallet",
      title: t("xxx"),
      icon:
        activeKey === "/wallet" ? (
          <AllApplication theme="two-tone" size="22" fill={["#000", "#000"]} />
        ) : (
          <AllApplication size="22" />
        ),
    },
    {
      key: "/bill",
      title: t("xxx"),
      icon:
        activeKey === "/bill" ? (
          <Calendar theme="two-tone" size="22" fill={["#000", "#000"]} />
        ) : (
          <Calendar size="22" />
        ),
    },
    {
      key: "/mine",
      title: t("我的"),
      icon:
        activeKey === "/mine" ? (
          <User theme="two-tone" size="22" fill={["#000", "#000"]} />
        ) : (
          <User size="22" />
        ),
    },
  ];

  const setRouteActive = (value: string) => {
    setActiveKey(value);
    navigate(value);
  };

  return (
    <div className="main-layout">
      <div className="content layout-content" style={{
        paddingTop: `${(env?.statusBarHeight ?? 0) / rootFontSize}rem`
      }}>
        <Outlet /> {/* 渲染子路由 */}
      </div>
      <div className="footer layout-tab">
        <TabBar activeKey={activeKey} onChange={setRouteActive}>
          {tabs.map((item) => (
            <TabBar.Item
              key={item.key}
              icon={item.icon}
              title={item.title}
              style={{
                color: "#333",
              }}
            />
          ))}
        </TabBar>
      </div>
    </div>
  );
};

export default MainLayout;
