export function UserStatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${
        active
          ? "border-green-500/40 bg-green-500/15 text-green-300"
          : "border-destructive/40 bg-destructive/10 text-destructive"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-green-400" : "bg-destructive"}`} />
      {active ? "نشط" : "معطّل"}
    </span>
  );
}
