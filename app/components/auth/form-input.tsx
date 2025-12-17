interface FormInputProps {
    label: string;
    type: 'text' | 'email' | 'password';
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    maxLength?: number;
}

/**
 * 表单输入组件 - 统一的输入框样式
 */
export function FormInput({
    label,
    type,
    value,
    onChange,
    placeholder,
    disabled = false,
    required = false,
    maxLength,
}: FormInputProps) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white/80">
                {label}
                {required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-base text-white transition-all placeholder:text-white/30 focus:outline-none focus:border-indigo-500 focus:bg-indigo-500/10 focus:ring-4 focus:ring-indigo-500/10"
                placeholder={placeholder}
                disabled={disabled}
                maxLength={maxLength}
            />
        </div>
    );
}
