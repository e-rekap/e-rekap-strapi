import { Typography } from "antd";

export default function PlaceholderPage({ title }: { title: string }) {
  return <Typography.Title level={3}>{title} (segera hadir)</Typography.Title>;
}
