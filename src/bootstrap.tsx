import ReactDOM from "react-dom/client";
import { SWRConfig } from "swr";
import { apiFetcher } from "services/api";
import router from "~/routes";
import Sidebar from "components/sidebar";
import RootRouterLayout from "components/layout/RootRouterLayout";
import { AuthProvider } from "./hooks/useAuth";

function RootApp() {
  return (
    <SWRConfig
      value={{
        fetcher: apiFetcher,
        revalidateOnFocus: false,
        revalidateOnMount: true,
        revalidateIfStale: false,
      }}
    >
      <AuthProvider>
        <RootRouterLayout routes={router} sidebar={<Sidebar />} />
      </AuthProvider>
    </SWRConfig>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(<RootApp />);
