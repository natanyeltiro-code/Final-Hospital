import { CheckCircle2 } from "lucide-react";

export default function SuccessPopup({
  open,
  title = "Success!",
  message,
  onClose,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/25 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-sm rounded-2xl bg-white px-8 py-10 text-center shadow-[0_24px_70px_rgba(15,23,42,0.28)]">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50">
          <CheckCircle2 className="text-emerald-500" size={42} />
        </div>

        <h3 className="mt-5 text-3xl font-semibold text-slate-900">{title}</h3>
        <p className="mt-3 text-base text-slate-700">{message || title}</p>

        <button
          type="button"
          onClick={onClose}
          className="mt-7 rounded-md bg-violet-200 px-5 py-2 text-sm font-semibold text-violet-800 transition hover:bg-violet-300"
        >
          OK
        </button>
      </div>
    </div>
  );
}
