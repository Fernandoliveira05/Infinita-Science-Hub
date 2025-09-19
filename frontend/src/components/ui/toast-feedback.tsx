// src/components/ui/toast-feedback.tsx
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { AlertCircle, Info } from "lucide-react";

/* ----------------------------- Keyframes CSS ----------------------------- */
const ensureFlaskKeyframes = () => {
  const ID = "flask-toast-keyframes";
  if (typeof document === "undefined" || document.getElementById(ID)) return;
  const style = document.createElement("style");
  style.id = ID;
  style.textContent = `
@keyframes flask-drop-tilt {
  0%   { transform: translateY(-16px) rotate(0deg);   opacity: 0; }
  40%  { transform: translateY(0px)  rotate(0deg);    opacity: 1; }
  70%  { transform: translateY(0px)  rotate(12deg);   }
  100% { transform: translateY(0px)  rotate(90deg);   }
}
@keyframes flask-bubble {
  0%   { transform: translateY(0)   scale(1);   opacity:.95; }
  50%  { transform: translateY(-3px) scale(1.04); opacity:.7; }
  100% { transform: translateY(0)   scale(1);   opacity:.95; }
}
@keyframes flask-bob {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-2px); }
}
  `;
  document.head.appendChild(style);
};

/* ----------------------------- Ícones Flask ------------------------------ */
type FlaskProps = { size?: number; className?: string; stroke?: string; liquid?: string; tilt?: boolean };

const FlaskIconBase: React.FC<FlaskProps> = ({
  size = 28,
  className,
  stroke = "rgb(16,185,129)",
  liquid = "rgb(5,150,105)",
  tilt = false,
}) => {
  useEffect(ensureFlaskKeyframes, []);
  const s = useMemo(() => ({ width: size, height: size }), [size]);

  return (
    <div
      className={className}
      style={{
        ...s,
        animation: `${tilt ? "flask-drop-tilt 800ms ease-out forwards" : "flask-bob 1600ms ease-in-out infinite"}`,
        transformOrigin: "60% 80%",
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" width={size} height={size} fill="none">
        <defs>
          <clipPath id="flaskBody">
            <path d="M24 8h16v4l-4 8v8l10 16c2 3-1 8-6 8H24c-5 0-8-5-6-8l10-16v-8l-4-8V8Z" />
          </clipPath>
        </defs>
        <path
          d="M24 8h16v4l-4 8v8l10 16c2 3-1 8-6 8H24c-5 0-8-5-6-8l10-16v-8l-4-8V8Z"
          stroke={stroke}
          strokeWidth="3"
          fill="white"
        />
        <g clipPath="url(#flaskBody)">
          <path d="M12 40h40v16H12z" fill={liquid} />
          <circle cx="28" cy="46" r="3" fill="rgba(255,255,255,0.95)" style={{ animation: "flask-bubble 1.6s ease-in-out infinite" }} />
          <circle cx="36" cy="50" r="2" fill="rgba(255,255,255,0.9)" style={{ animation: "flask-bubble 1.8s .2s ease-in-out infinite" }} />
          <circle cx="32" cy="44" r="2.5" fill="rgba(255,255,255,0.92)" style={{ animation: "flask-bubble 1.7s .1s ease-in-out infinite" }} />
        </g>
        <rect x="28" y="6" width="8" height="6" rx="1" fill={stroke} />
      </svg>
    </div>
  );
};

const FlaskGreen = (p: { size?: number; className?: string }) => (
  <FlaskIconBase {...p} stroke="rgb(16,185,129)" liquid="rgb(5,150,105)" tilt={false} />
);
const FlaskPurpleFalling = (p: { size?: number; className?: string }) => (
  <FlaskIconBase {...p} stroke="rgb(124,58,237)" liquid="rgb(147,51,234)" tilt />
);

/* ------------------------- Barra de progresso (timer) -------------------- */
const ToastProgressBar: React.FC<{ duration: number; colorClass?: string }> = ({ duration, colorClass }) => {
  const [w, setW] = useState(100);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setW(100 - p * 100);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration]);
  return (
    <div className="relative mt-3 h-1 w-full bg-muted rounded">
      <div
        className={`absolute left-0 top-0 h-1 rounded ${colorClass ?? "bg-gray-400"}`}
        style={{ width: `${w}%`, transition: "width 120ms linear" }}
      />
    </div>
  );
};

/* ----------------------------- Card base (UI) ---------------------------- */
/* Removi wrappers extras e deixei o card único.
   O container raiz do toast fica TRANSPARENTE via className nas chamadas do toast(). */
const BaseCard: React.FC<{
  icon?: React.ReactNode;
  title: string;
  message?: string;
  accentColorClass: string; // barra lateral
  titleClass: string;       // cor do título
  withTimerMs?: number;
  timerColorClass?: string;
}> = ({ icon, title, message, accentColorClass, titleClass, withTimerMs, timerColorClass }) => {
  return (
    <div className="flex items-stretch gap-3 rounded-md border border-border bg-white shadow-sm overflow-hidden">
      {/* Accent bar à esquerda */}
      <div className={`w-1 ${accentColorClass}`} />
      <div className="flex items-start gap-3 p-3">
        {icon && <div className="mt-0.5">{icon}</div>}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${titleClass}`}>{title}</p>
          {message && <p className="text-sm text-foreground/80 mt-0.5">{message}</p>}
          {withTimerMs && <ToastProgressBar duration={withTimerMs} colorClass={timerColorClass} />}
        </div>
      </div>
    </div>
  );
};

/* ------------------------------- API pública ----------------------------- */
/* Em TODAS as chamadas: className zera padding/fundo/borda do wrapper do provider,
   evitando “segundo container” branco por trás do nosso card. */

// SUCCESS — frasco verde borbulhando
export const showSuccessToast = (message: string, duration = 3200) => {
  toast({
    duration,
    className: "p-0 bg-transparent border-0 shadow-none", // <- remove container externo
    description: (
      <BaseCard
        icon={<FlaskGreen size={28} />}
        title="Success"
        message={message}
        accentColorClass="bg-emerald-500"
        titleClass="text-emerald-700"
        withTimerMs={duration}
        timerColorClass="bg-emerald-500"
      />
    ),
  });
};

// ERROR — frasco roxo caindo/girando 90°
export const showErrorToast = (message: string, duration = 5200) => {
  toast({
    duration,
    className: "p-0 bg-transparent border-0 shadow-none",
    description: (
      <BaseCard
        icon={<FlaskPurpleFalling size={28} />}
        title="Something went wrong"
        message={message}
        accentColorClass="bg-purple-600"
        titleClass="text-purple-700"
        withTimerMs={duration}
        timerColorClass="bg-purple-600"
      />
    ),
  });
};

// WARNING
export const showWarningToast = (message: string, duration = 4200) => {
  toast({
    duration,
    className: "p-0 bg-transparent border-0 shadow-none",
    description: (
      <BaseCard
        icon={<AlertCircle className="w-5 h-5 text-amber-600" />}
        title="Warning"
        message={message}
        accentColorClass="bg-amber-500"
        titleClass="text-amber-700"
        withTimerMs={duration}
        timerColorClass="bg-amber-500"
      />
    ),
  });
};

// INFO
export const showInfoToast = (message: string, duration = 3600) => {
  toast({
    duration,
    className: "p-0 bg-transparent border-0 shadow-none",
    description: (
      <BaseCard
        icon={<Info className="w-5 h-5 text-sky-600" />}
        title="Info"
        message={message}
        accentColorClass="bg-sky-500"
        titleClass="text-sky-700"
        withTimerMs={duration}
        timerColorClass="bg-sky-500"
      />
    ),
  });
};
