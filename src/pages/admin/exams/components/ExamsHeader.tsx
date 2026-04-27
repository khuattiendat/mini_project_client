import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Space, Typography } from "antd";

const { Title } = Typography;

interface ExamsHeaderProps {
  loading: boolean;
  onRefresh: () => void;
  onCreate: () => void;
}

export function ExamsHeader({
  loading,
  onRefresh,
  onCreate,
}: ExamsHeaderProps) {
  return (
    <div className="border-slate-200 pb-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Title
            level={4}
            style={{ margin: 0, color: "#0f172a", fontSize: 26 }}
          >
            Quản lý đề thi
          </Title>
          <div className="mt-1 text-sm text-slate-500">
            Danh sách đề thi trong hệ thống
          </div>
        </div>

        <Space wrap>
          <Button
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            loading={loading}
            className="!rounded-md"
          >
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onCreate}
            className="!rounded-md !border-0 !bg-[#5b4bdb] !px-4 !shadow-[0_10px_18px_rgba(91,75,219,0.28)] hover:!bg-[#4f40cc]"
          >
            Thêm đề thi
          </Button>
        </Space>
      </div>
    </div>
  );
}
