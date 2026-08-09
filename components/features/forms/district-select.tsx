"use client";

import { useState } from "react";
import { STATE_DISTRICTS } from "@/lib/locations";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface DistrictSelectProps {
  state: string | undefined;
  value: string | undefined;
  onChange: (value: string) => void;
  style?: React.CSSProperties;
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
    return <Input name={name} value={districtValue} onChange={e => onChange(e.target.value)} required={required} placeholder="Enter district" style={style} disabled={!state} />;
  }

  if (customMode) {
    return (
      <div>
        <Input name={name} value={districtValue} onChange={e => onChange(e.target.value)} required={required} placeholder="Enter district" style={style} />
        <Button type="button" variant="link" size="xs" onClick={() => { setCustomMode(false); onChange(""); }} className="mt-1 p-0 h-auto text-[var(--gs-accent)]">
          ← Choose from list
        </Button>
      </div>
    );
  }

  return (
    <Select
      name={name}
      value={districtValue || undefined}
      onValueChange={(v) => {
        const val = v ?? "";
        if (val === "Other") { setCustomMode(true); onChange(""); }
        else onChange(val);
      }}
    >
      <SelectTrigger className="w-full" style={style}><SelectValue placeholder="Select district" /></SelectTrigger>
      <SelectContent>
        {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
