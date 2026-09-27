import { useState, type ReactNode } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  type RouteObject,
} from "react-router";
import { Layout } from "antd";
import DevUserSwitcher from "./DevUserSwitcher";

function Shell({ sidebar }: { sidebar: ReactNode }) {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout.Header
        style={{
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        E-Rekap
        <DevUserSwitcher />
      </Layout.Header>
      <Layout>
        <Layout.Sider theme="light">{sidebar}</Layout.Sider>
        <Layout.Content style={{ padding: 24 }}>
          <Outlet /> {/* routes dari E-Rekap masuk di sini */}
        </Layout.Content>
      </Layout>
    </Layout>
  );
}

type Props = { routes: RouteObject[]; sidebar: ReactNode };

export default function RootRouterLayout({ routes, sidebar }: Props) {
  // useState(() => ...) = router cukup dibikin SEKALI, gak dibikin ulang tiap render
  const [router] = useState(() =>
    createBrowserRouter([
      { path: "/", element: <Shell sidebar={sidebar} />, children: routes },
    ]),
  );
  return <RouterProvider router={router} />;
}
