import {
  CalendarOutlined,
  ClockCircleOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import { Card, Col, List, Row, Tag, Typography } from "antd";

const nextClasses = [
  {
    id: "class-1",
    title: "Toan tu duy nang cao",
    time: "19:00 - 20:30",
    date: "Thu 2, 27/04/2026",
    teacher: "GV. Nguyen Hoang Anh",
  },
  {
    id: "class-2",
    title: "Tieng Anh giao tiep",
    time: "20:45 - 22:00",
    date: "Thu 4, 29/04/2026",
    teacher: "GV. Le Minh Thu",
  },
];

export default function UserHomePage() {
  return (
    <div className="space-y-6">
      <Typography.Title level={2} className="mb-0 !text-2xl">
        Tong quan hoc vien
      </Typography.Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Typography.Text type="secondary">
              Khoa hoc dang hoc
            </Typography.Text>
            <Typography.Title level={3} className="!mb-0 !mt-2">
              3 khoa
            </Typography.Title>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Typography.Text type="secondary">Buoi hoc hom nay</Typography.Text>
            <Typography.Title level={3} className="!mb-0 !mt-2">
              2 buoi
            </Typography.Title>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Typography.Text type="secondary">Ti le chuyen can</Typography.Text>
            <Typography.Title level={3} className="!mb-0 !mt-2">
              96%
            </Typography.Title>
          </Card>
        </Col>
      </Row>

      <Card title="Lich hoc sap toi" extra={<Tag color="blue">User role</Tag>}>
        <List
          dataSource={nextClasses}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={<ReadOutlined className="text-lg text-blue-500" />}
                title={item.title}
                description={
                  <div className="space-y-1 text-slate-600">
                    <div className="flex items-center gap-2">
                      <CalendarOutlined />
                      <span>{item.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClockCircleOutlined />
                      <span>{item.time}</span>
                    </div>
                    <div>{item.teacher}</div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
