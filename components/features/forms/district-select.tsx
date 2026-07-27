"use client";

import { useState } from "react";
import { STATE_DISTRICTS } from "@/lib/locations";

interface DistrictSelectProps {
  state: string | undefined;
  value: string | undefined;
  onChange: (value: string) => void;
  style: React.CSSProperties;
  required?: boolean;
  name?: string;
}

// ponytail: mirrors the STATE_CITIES select/custom-input pattern already used for city fields.
// Callers should pass `key={state}` so this remounts (resetting custom-entry mode) when the state changes.
export function DistrictSelect({ state, value, onChange, style, required, name }: DistrictSelectProps) {
  const districts = state ? STATE_DISTRICTS[state] ?? [] : [];
  const districtValue = value ?? "";
  const [customMode, setCustomMode] = useState(districts.length > 0 && districtValue !== "" && !districts.includes(districtValue));

  if (districts.length === 0) {
    return <input name={name} value={districtValue} onChange={e => onChange(e.target.value)} required={required} placeholder="Enter district" style={style} disabled={!state} />;
  }

  if (customMode) {
    return (
      <div>
        <input name={name} value={districtValue} onChange={e => onChange(e.target.value)} required={required} placeholder="Enter district" style={style} />
        <button type="button" onClick={() => { setCustomMode(false); onChange(""); }} style={{ marginTop: 4, background: "none", border: "none", padding: 0, fontSize: 11, color: "#4A55BE", cursor: "pointer" }}>
          ← Choose from list
        </button>
      </div>
    );
  }

  return (
    <select
      name={name}
      value={districtValue}
      onChange={e => {
        if (e.target.value === "Other") { setCustomMode(true); onChange(""); }
        else onChange(e.target.value);
      }}
      required={required}
      style={{ ...style, appearance: "none" }}
    >
      <option value="">Select district</option>
      {districts.map(d => <option key={d} value={d}>{d}</option>)}
    </select>
  );
}
