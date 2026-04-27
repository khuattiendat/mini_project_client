import { SearchOutlined } from "@ant-design/icons";
import { Input } from "antd";
import { useEffect, useState } from "react";
import { useDebounce } from "../../hooks/useDebounce";

interface InputSearchProps {
  value: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export function InputSearch({
  value,
  onSearchChange,
  placeholder = "Tìm kiếm...",
  debounceMs = 350,
  className,
}: InputSearchProps) {
  const [innerValue, setInnerValue] = useState(value);
  const debouncedValue = useDebounce(innerValue, debounceMs);

  useEffect(() => {
    setInnerValue(value);
  }, [value]);

  useEffect(() => {
    if (debouncedValue === value) {
      return;
    }

    onSearchChange(debouncedValue);
  }, [debouncedValue, onSearchChange, value]);

  return (
    <Input
      allowClear
      value={innerValue}
      onChange={(event) => setInnerValue(event.target.value)}
      placeholder={placeholder}
      prefix={<SearchOutlined className="text-slate-400" />}
      className={className}
    />
  );
}
