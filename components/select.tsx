import { input } from "./ui";

export function Select({
  name,
  options,
  value,
  empty = "None",
  required,
}: {
  name: string;
  options: { id: string; name: string }[];
  value?: string | null;
  empty?: string;
  required?: boolean;
}) {
  return (
    <select name={name} defaultValue={value ?? ""} className={input} required={required}>
      <option value="">{empty}</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </select>
  );
}
