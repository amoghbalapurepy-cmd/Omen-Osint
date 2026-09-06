import { Activity } from "lucide-react";
import { SYSTEM_STATUS } from "@/lib/omen";
import { Panel, PanelHeader, StatusDot } from "./omen-ui";

export function SystemStatus() {
  return (
    <Panel>
      <PanelHeader icon={<Activity size={15} />} title="System Status" />
      <ul className="divide-y divide-line">
        {SYSTEM_STATUS.map((row) => (
          <li
            key={row.label}
            className="flex items-center justify-between px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <StatusDot tone={row.tone} pulse />
              <span className="text-[13px] text-secondary">{row.label}</span>
            </div>
            <span
              className="mono text-[11px] uppercase tracking-[0.14em]"
              style={{ color: row.tone === "green" ? "var(--green)" : "var(--cyan)" }}
            >
              {row.status}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
