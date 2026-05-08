interface InputFieldProps {
  label: string;
  value: number;
  unit?: string;
  step?: number;
  min?: number;
  onChange: (value: number) => void;
}

export function InputField({ label, value, unit, step = 0.01, min = 0, onChange }: InputFieldProps) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-700">
      <span className="font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />
        {unit ? <span className="text-xs text-slate-500">{unit}</span> : null}
      </div>
    </label>
  );
}
