import { Button } from "antd";

export default function HomePage() {
  return (
    <Button
      type="primary"
      onClick={() => console.log("API URL:", process.env.REACT_APP_API_URL)}
    >
      Halo E-Rekap
    </Button>
  );
}
