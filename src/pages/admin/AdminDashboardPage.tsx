import {
  AlertOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  TeamOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { Button, Card, Empty, Skeleton, Tooltip } from "antd";
import useSWR from "swr";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getDashboardStatsApi } from "../../api/examApi";

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  initialized: "#94a3b8",
  active: "#3b82f6",
  submitted: "#22c55e",
  violated: "#f97316",
  terminated: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  initialized: "Khởi tạo",
  active: "Đang thi",
  submitted: "Đã nộp",
  violated: "Vi phạm",
  terminated: "Kết thúc",
};

const VIOLATION_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#8b5cf6", "#06b6d4", "#ec4899",
];

const OVERVIEW_CARDS = [
  {
    key: "totalUsers" as const,
    label: "Người dùng",
    icon: <TeamOutlined />,
    bg: "bg-blue-50",
    iconColor: "text-blue-600",
    border: "border-blue-100",
  },
  {
    key: "totalExams" as const,
    label: "Đề thi",
    icon: <FileTextOutlined />,
    bg: "bg-violet-50",
    iconColor: "text-violet-600",
    border: "border-violet-100",
  },
  {
    key: "totalQuestions" as const,
    label: "Câu hỏi",
    icon: <QuestionCircleOutlined />,
    bg: "bg-amber-50",
    iconColor: "text-amber-600",
    border: "border-amber-100",
  },
  {
    key: "totalAttempts" as const,
    label: "Lượt thi",
    icon: <TrophyOutlined />,
    bg: "bg-green-50",
    iconColor: "text-green-600",
    border: "border-green-100",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function OverviewCard({
  label,
  value,
  icon,
  bg,
  iconColor,
  border,
  loading,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  bg: string;
  iconColor: string;
  border: string;
  loading: boolean;
}) {
  return (
    <div className={`flex items-center gap-4 rounded-xl border ${border} ${bg} p-5`}>
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-2xl shadow-sm ${iconColor}`}>
        {icon}
      </div>
      <div>
        <div className="text-sm text-slate-500">{label}</div>
        {loading ? (
          <Skeleton.Input active size="small" style={{ width: 60, marginTop: 4 }} />
        ) : (
          <div className="text-3xl font-bold text-slate-900">
            {value.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  icon,
  children,
  loading,
  skeletonRows = 6,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  loading: boolean;
  skeletonRows?: number;
}) {
  return (
    <Card
      title={
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          {icon}
          {title}
        </span>
      }
      className="h-full shadow-[0_1px_4px_rgba(15,23,42,0.06)]"
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: skeletonRows }} />
      ) : (
        children
      )}
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { data, isLoading, mutate } = useSWR(
    "dashboard:stats",
    getDashboardStatsApi,
    { revalidateOnFocus: false },
  );

  const overview = data?.overview;
  const attemptsByStatus = data?.attemptsByStatus ?? [];
  const topExams = data?.topExams ?? [];
  const timeline = data?.attemptsTimeline ?? [];
  const violations = data?.violations;

  // Format date labels for timeline
  const timelineFormatted = timeline.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("vi-VN", {
      month: "numeric",
      day: "numeric",
    }),
  }));

  // Pie data for attempt status
  const pieData = attemptsByStatus.map((s) => ({
    name: STATUS_LABELS[s.status] ?? s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] ?? "#94a3b8",
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="m-0 text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Tổng quan hệ thống thi trắc nghiệm
          </p>
        </div>
        <Tooltip title="Làm mới dữ liệu">
          <Button
            icon={<ReloadOutlined />}
            loading={isLoading}
            onClick={() => void mutate()}
          >
            Làm mới
          </Button>
        </Tooltip>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {OVERVIEW_CARDS.map((card) => (
          <OverviewCard
            key={card.key}
            label={card.label}
            value={overview?.[card.key] ?? 0}
            icon={card.icon}
            bg={card.bg}
            iconColor={card.iconColor}
            border={card.border}
            loading={isLoading}
          />
        ))}
      </div>

      {/* Timeline + Pie */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Attempts timeline — 2/3 width */}
        <div className="lg:col-span-2">
          <SectionCard
            title="Lượt thi theo ngày (14 ngày gần nhất)"
            loading={isLoading}
            skeletonRows={7}
          >
            {timelineFormatted.length === 0 ? (
              <Empty description="Chưa có dữ liệu" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={timelineFormatted} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <RechartTooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                    formatter={(v: number) => [v, "Lượt thi"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#3b82f6" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </SectionCard>
        </div>

        {/* Attempts by status pie — 1/3 width */}
        <SectionCard
          title="Trạng thái lượt thi"
          loading={isLoading}
          skeletonRows={7}
        >
          {pieData.length === 0 ? (
            <Empty description="Chưa có dữ liệu" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <RechartTooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                  formatter={(v: number, name: string) => [v, name]}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      {/* Top exams + Violations */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top exams bar chart */}
        <SectionCard
          title="Top đề thi có nhiều lượt thi nhất"
          icon={<TrophyOutlined className="text-amber-500" />}
          loading={isLoading}
          skeletonRows={6}
        >
          {topExams.length === 0 ? (
            <Empty description="Chưa có dữ liệu" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={topExams}
                layout="vertical"
                margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="examTitle"
                  width={130}
                  tick={{ fontSize: 11, fill: "#475569" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: string) =>
                    v.length > 18 ? v.slice(0, 18) + "…" : v
                  }
                />
                <RechartTooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                  formatter={(v: number) => [v, "Lượt thi"]}
                />
                <Bar dataKey="attemptCount" radius={[0, 4, 4, 0]} fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        {/* Violations */}
        <SectionCard
          title={`Vi phạm · Tổng: ${violations?.totalViolations ?? 0}`}
          icon={<AlertOutlined className="text-red-500" />}
          loading={isLoading}
          skeletonRows={6}
        >
          {!violations || violations.byType.length === 0 ? (
            <Empty description="Không có vi phạm nào" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={violations.byType}
                margin={{ top: 0, right: 16, left: -16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="type"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: string) =>
                    v.length > 12 ? v.slice(0, 12) + "…" : v
                  }
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <RechartTooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                  formatter={(v: number) => [v, "Vi phạm"]}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {violations.byType.map((_, i) => (
                    <Cell key={i} fill={VIOLATION_COLORS[i % VIOLATION_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
