import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Intern type
type Status = "Active" | "Offer" | "Completed" | "Offboarded";

type Intern = {
  id: string;
  name: string;
  email: string;
  department: string;
  mentor: string;
  startDate: string; // ISO date
  status: Status;
  score: number; // 0 - 100
};

const seedInterns: Intern[] = [
  {
    id: "1",
    name: "Ava Patel",
    email: "ava.patel@example.com",
    department: "Engineering",
    mentor: "M. Nguyen",
    startDate: new Date().toISOString().slice(0, 10),
    status: "Active",
    score: 92,
  },
  {
    id: "2",
    name: "Liam Johnson",
    email: "liam.johnson@example.com",
    department: "Design",
    mentor: "S. Kaur",
    startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10),
    status: "Active",
    score: 81,
  },
  {
    id: "3",
    name: "Maya Chen",
    email: "maya.chen@example.com",
    department: "Marketing",
    mentor: "R. Davis",
    startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString().slice(0, 10),
    status: "Completed",
    score: 88,
  },
  {
    id: "4",
    name: "Ethan García",
    email: "ethan.garcia@example.com",
    department: "Engineering",
    mentor: "K. Brown",
    startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10),
    status: "Offer",
    score: 75,
  },
];

const departments = ["Engineering", "Design", "Marketing", "Product", "HR"];
const statuses: Status[] = ["Active", "Offer", "Completed", "Offboarded"];

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function stringToHue(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
}

function exportToCsv(rows: Intern[]) {
  const header = ["Name", "Email", "Department", "Mentor", "Start Date", "Status", "Score"];
  const body = rows.map((r) => [r.name, r.email, r.department, r.mentor, r.startDate, r.status, String(r.score)]);
  const csv = [header, ...body].map((r) => r.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `interns-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Index() {
  const [interns, setInterns] = useState<Intern[]>(seedInterns);
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState<string>("All");
  const [status, setStatus] = useState<string>("All");

  // Demo server call to ensure backend is wired
  useEffect(() => {
    fetch("/api/demo").catch(() => void 0);
  }, []);

  const filtered = useMemo(() => {
    return interns
      .filter((i) => (dept === "All" ? true : i.department === dept))
      .filter((i) => (status === "All" ? true : i.status === status))
      .filter((i) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
          i.name.toLowerCase().includes(q) ||
          i.email.toLowerCase().includes(q) ||
          i.mentor.toLowerCase().includes(q) ||
          i.department.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [interns, search, dept, status]);

  const stats = useMemo(() => {
    const active = interns.filter((i) => i.status === "Active").length;
    const offers = interns.filter((i) => i.status === "Offer").length;
    const completed = interns.filter((i) => i.status === "Completed").length;
    const avgScore = interns.length
      ? Math.round(interns.reduce((s, i) => s + i.score, 0) / interns.length)
      : 0;
    return { active, offers, completed, avgScore };
  }, [interns]);

  // Add intern dialog state
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<Intern, "id">>({
    name: "",
    email: "",
    department: departments[0],
    mentor: "",
    startDate: new Date().toISOString().slice(0, 10),
    status: "Active",
    score: 80,
  });

  function addIntern() {
    if (!form.name || !form.email) return;
    const id = Math.random().toString(36).slice(2, 9);
    setInterns((prev) => [{ id, ...form }, ...prev]);
    setOpen(false);
    setForm({
      name: "",
      email: "",
      department: departments[0],
      mentor: "",
      startDate: new Date().toISOString().slice(0, 10),
      status: "Active",
      score: 80,
    });
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="rounded-xl border bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Track interns with clarity
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Manage onboarding, performance, and progress across departments. Fast search, flexible filters, and easy exports.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow hover:from-indigo-600 hover:to-violet-700"
              onClick={() => setOpen(true)}
            >
              Add Intern
            </Button>
            <Button variant="outline" onClick={() => exportToCsv(filtered)}>
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <Input
              placeholder="Search by name, email, mentor, or department"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="sm:col-span-1">
            <Select value={dept} onValueChange={setDept}>
              <SelectTrigger>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem value={d} key={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-1">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                {statuses.map((s) => (
                  <SelectItem value={s} key={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active interns" value={stats.active} trendLabel="Currently onboarded" color="from-emerald-500 to-teal-500" />
        <StatCard label="Offers" value={stats.offers} trendLabel="Awaiting start" color="from-sky-500 to-cyan-500" />
        <StatCard label="Completed" value={stats.completed} trendLabel="Program finished" color="from-indigo-500 to-violet-600" />
        <StatCard label="Avg score" value={`${stats.avgScore}%`} trendLabel="Performance" color="from-fuchsia-500 to-pink-500" />
      </section>

      {/* Table */}
      <section className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Intern</TableHead>
              <TableHead className="hidden sm:table-cell">Department</TableHead>
              <TableHead className="hidden lg:table-cell">Mentor</TableHead>
              <TableHead>Start date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((i) => (
              <TableRow key={i.id} className="">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-9 w-9 shrink-0 rounded-full text-white grid place-items-center text-xs font-bold"
                      style={{
                        backgroundColor: `hsl(${stringToHue(i.name)}, 70%, 55%)`,
                      }}
                    >
                      {initials(i.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{i.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{i.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">{i.department}</TableCell>
                <TableCell className="hidden lg:table-cell">{i.mentor}</TableCell>
                <TableCell>{new Date(i.startDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <StatusBadge status={i.status} />
                </TableCell>
                <TableCell className="text-right">
                  <span className={cn("font-semibold", i.score >= 85 && "text-emerald-600", i.score < 70 && "text-destructive")}>{i.score}%</span>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  No interns match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>

      {/* Add Intern Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <span />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a new intern</DialogTitle>
            <DialogDescription>Fill in details to add to your tracker.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Department</label>
                <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Mentor</label>
                <Input value={form.mentor} onChange={(e) => setForm({ ...form, mentor: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Start date</label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={form.status} onValueChange={(v: Status) => setForm({ ...form, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Performance score</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={form.score}
                onChange={(e) => setForm({ ...form, score: Number(e.target.value || 0) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow hover:from-indigo-600 hover:to-violet-700"
              onClick={addIntern}
              disabled={!form.name || !form.email}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  label,
  value,
  trendLabel,
  color,
}: {
  label: string;
  value: number | string;
  trendLabel: string;
  color: string; // tailwind gradient classes
}) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className={cn("h-1 w-full bg-gradient-to-r", color)} />
      <div className="p-5">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-2 text-2xl font-bold">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{trendLabel}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, string> = {
    Active: "bg-emerald-500/15 text-emerald-700 border-emerald-200",
    Offer: "bg-sky-500/15 text-sky-700 border-sky-200",
    Completed: "bg-indigo-500/15 text-indigo-700 border-indigo-200",
    Offboarded: "bg-zinc-500/15 text-zinc-700 border-zinc-300",
  };
  return <Badge className={cn("px-2.5", map[status])}>{status}</Badge>;
}
