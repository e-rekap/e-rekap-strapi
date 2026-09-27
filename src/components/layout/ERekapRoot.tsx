import { Outlet } from "react-router";
import { RecoilRoot } from "recoil";
import { App as AntdApp } from "antd";

export default function ErekapRoot() {
  return (
    <RecoilRoot>
      <AntdApp>
        <Outlet /> {/* halaman-halaman E-Rekap muncul di sini */}
      </AntdApp>
    </RecoilRoot>
  );
}
