import { TeamOutlined } from "@ant-design/icons";
import { Col, Row, Statistic } from "antd";

interface UsersStatsProps {
  total: number;
  activeCount: number;
  inactiveCount: number;
}

export function UsersStats({
  total,
  activeCount,
  inactiveCount,
}: UsersStatsProps) {
  return (
    <Row
      gutter={0}
      className="mb-3 overflow-hidden rounded-md border border-slate-200"
    >
      <Col xs={24} md={8}>
        <div className="min-h-[108px] border-b border-r border-slate-200 p-3 md:border-b-0">
          <Statistic
            title="Tổng người dùng"
            value={total}
            prefix={<TeamOutlined />}
            valueStyle={{ fontSize: 28 }}
          />
        </div>
      </Col>
      <Col xs={12} md={8}>
        <div className="min-h-[108px] border-r border-slate-200 p-3">
          <Statistic
            title="Đang hoạt động"
            value={activeCount}
            valueStyle={{ color: "#16a34a", fontSize: 28 }}
          />
        </div>
      </Col>
      <Col xs={12} md={8}>
        <div className="min-h-[108px] p-3">
          <Statistic
            title="Đang khoá"
            value={inactiveCount}
            valueStyle={{ color: "#dc2626", fontSize: 28 }}
          />
        </div>
      </Col>
    </Row>
  );
}
