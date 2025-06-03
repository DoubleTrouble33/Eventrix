interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function AuthInput({ label, error, ...props }: AuthInputProps) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        {...props}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
