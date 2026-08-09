"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EarcRoleToggle } from "./earc-role-toggle";
import { Card, CardContent } from "@/components/ui/card";

interface EarcCandidate {
  id: string;
  clerk_id: string;
  name: string;
  email: string;
  role: string;
}

export function EarcStaffTable({ users, currentUserId }: { users: EarcCandidate[]; currentUserId: string }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
  }, [users, query]);

  return (
    <>
      <div className="relative mb-4 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name or email..."
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
<CardContent>
          <p style={{ fontSize: 14, color: "var(--gs-muted)" }}>No users match &ldquo;{query}&rdquo;.</p>
        </CardContent>
</Card>
      ) : (
        <Table className="rounded-xl overflow-hidden border border-border">
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => (
              <TableRow key={u.id} className="hover:bg-muted/50">
                <TableCell>
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </TableCell>
                <TableCell className="capitalize">{u.role}</TableCell>
                <TableCell>
                  {u.clerk_id === currentUserId ? (
                    <span className="text-xs text-muted-foreground">Cannot change own role</span>
                  ) : (
                    <EarcRoleToggle clerkId={u.clerk_id} isEarcStaff={u.role === "earc_staff"} />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
