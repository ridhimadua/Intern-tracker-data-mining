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
import { Check, X } from "lucide-react";

type StatusActivity = "Active" | "Inactive" | "Leave";
type YesNo = "Yes" | "No";
type Performance = "Good" | "Weak";
type Segregation = "Resign" | "Warning" | "Terminated" | "Relocated";
type SheetStatus = "Green" | "Red" | "Black";

type Intern = {
  id: string;
  name: string;
  email: string;
  statusActivity: StatusActivity;
  excelSubmitted: YesNo;
  aiChatAdded: boolean;
  dataMiningGC: boolean;
  speakersCount: number;
  speakersTarget: number; // usually 100
  performance: Performance;
  segregation: Segregation | null;
  sheetStatus: SheetStatus;
  dataRepurposed: YesNo;
};

const departments = ["Engineering", "Design", "Marketing", "Product", "HR"];

function initials(name: string) {
  if (!name) return "";
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
  for (let i = 0; i < (str || "").length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
}

function exportToCsv(rows: Intern[]) {
  const header = [
    "Name",
    "Email",
    "Status",
    "ExcelSubmitted",
    "AIChatAdded",
    "DataMiningGC",
    "SpeakersCount",
    "Performance",
    "Segregation",
    "SheetStatus",
    "DataRepurposed",
  ];
  const body = rows.map((r) => [
    r.name,
    r.email,
    r.statusActivity,
    r.excelSubmitted,
    r.aiChatAdded ? "Yes" : "No",
    r.dataMiningGC ? "Yes" : "No",
    r.speakersCount,
    r.performance,
    r.segregation ?? "",
    r.sheetStatus,
    r.dataRepurposed,
  ]);
  const csv = [header, ...body]
    .map((r) => r.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `interns-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function generateSeedInterns(count: number): Intern[] {
  const out: Intern[] = [];
  for (let i = 0; i < count; i++) {
    const statusRand = Math.random();
    const statusActivity: StatusActivity =
      statusRand > 0.15 ? "Active" : "Inactive";
    const excelSubmitted: YesNo = Math.random() > 0.35 ? "Yes" : "No";
    const aiChatAdded = Math.random() > 0.5;
    const dataMiningGC = Math.random() > 0.5;
    const speakersCount = Math.floor(Math.random() * 120); // 0-119
    const speakersTarget = 100;
    const performance: Performance =
      speakersCount > 60 && aiChatAdded && dataMiningGC
        ? "Good"
        : Math.random() > 0.8
          ? "Good"
          : "Weak";
    const segRand = Math.random();
    const segregation: Segregation | null =
      segRand > 0.985
        ? "Relocated"
        : segRand > 0.97
          ? "Terminated"
          : segRand > 0.95
            ? "Warning"
            : null;
    let sheetStatus: SheetStatus = "Red";
    if (segregation === "Terminated" || segregation === "Relocated")
      sheetStatus = "Black";
    else if (excelSubmitted === "Yes" && (aiChatAdded || dataMiningGC))
      sheetStatus = "Green";
    else sheetStatus = Math.random() > 0.7 ? "Red" : "Green";
    const dataRepurposed: YesNo = Math.random() > 0.8 ? "Yes" : "No";

    out.push({
      id: `${Date.now()}-${i}`,
      name: "",
      email: "",
      statusActivity,
      excelSubmitted,
      aiChatAdded,
      dataMiningGC,
      speakersCount,
      speakersTarget,
      performance,
      segregation,
      sheetStatus,
      dataRepurposed,
    });
  }
  return out;
}

export default function Index() {
  const [interns, setInterns] = useState<Intern[]>(() =>
    generateSeedInterns(550),
  );
  const [search, setSearch] = useState("");
  const [filterSheet, setFilterSheet] = useState<string>("All");
  const [filterPerf, setFilterPerf] = useState<string>("All");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  useEffect(() => {
    fetch("/api/demo").catch(() => void 0);
  }, []);

  const filtered = useMemo(() => {
    return interns
      .filter((i) =>
        filterSheet === "All" ? true : i.sheetStatus === filterSheet,
      )
      .filter((i) =>
        filterPerf === "All" ? true : i.performance === filterPerf,
      )
      .filter((i) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
          (i.name || "").toLowerCase().includes(q) ||
          (i.email || "").toLowerCase().includes(q) ||
          (i.segregation ?? "").toLowerCase().includes(q)
        );
      })
      .sort(
        (a, b) =>
          Number(b.id.split("-")[1] || 0) - Number(a.id.split("-")[1] || 0),
      );
  }, [interns, search, filterSheet, filterPerf]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const summary = useMemo(() => {
    const total = interns.length;
    const green = interns.filter((i) => i.sheetStatus === "Green").length;
    const red = interns.filter((i) => i.sheetStatus === "Red").length;
    const black = interns.filter((i) => i.sheetStatus === "Black").length;
    const active = interns.filter((i) => i.statusActivity === "Active").length;
    const inactive = total - active;
    const excelYes = interns.filter((i) => i.excelSubmitted === "Yes").length;
    const excelNo = total - excelYes;
    const tasksCompleted = interns.filter(
      (i) =>
        i.aiChatAdded && i.dataMiningGC && i.speakersCount >= i.speakersTarget,
    ).length;
    const good = interns.filter((i) => i.performance === "Good").length;
    const weak = interns.filter((i) => i.performance === "Weak").length;
    const repurposedYes = interns.filter(
      (i) => i.dataRepurposed === "Yes",
    ).length;
    const repurposedNo = total - repurposedYes;
    return {
      total,
      green,
      red,
      black,
      active,
      inactive,
      excelYes,
      excelNo,
      tasksCompleted,
      good,
      weak,
      repurposedYes,
      repurposedNo,
    };
  }, [interns]);

  // inline edits
  function toggleAiChat(id: string) {
    setInterns((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, aiChatAdded: !p.aiChatAdded } : p,
      ),
    );
  }
  function toggleDataMining(id: string) {
    setInterns((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, dataMiningGC: !p.dataMiningGC } : p,
      ),
    );
  }
  function updateSpeakers(id: string, count: number) {
    setInterns((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = {
          ...p,
          speakersCount: Math.max(0, Math.min(1000, Math.floor(count))),
        };
        if (
          updated.speakersCount >= updated.speakersTarget &&
          (!updated.segregation ||
            (updated.segregation !== "Terminated" &&
              updated.segregation !== "Relocated"))
        ) {
          updated.sheetStatus = "Green";
        }
        return updated;
      }),
    );
  }
  function setSheetStatus(id: string, status: SheetStatus) {
    setInterns((prev) =>
      prev.map((p) => (p.id === id ? { ...p, sheetStatus: status } : p)),
    );
  }
  function setStatusActivity(id: string, s: StatusActivity) {
    setInterns((prev) =>
      prev.map((p) => (p.id === id ? { ...p, statusActivity: s } : p)),
    );
  }
  function setExcelSubmitted(id: string, v: YesNo) {
    setInterns((prev) =>
      prev.map((p) => (p.id === id ? { ...p, excelSubmitted: v } : p)),
    );
  }
  function setDataRepurposed(id: string, v: YesNo) {
    setInterns((prev) =>
      prev.map((p) => (p.id === id ? { ...p, dataRepurposed: v } : p)),
    );
  }
  function setPerformance(id: string, v: Performance) {
    setInterns((prev) =>
      prev.map((p) => (p.id === id ? { ...p, performance: v } : p)),
    );
  }
  function setSegregation(id: string, v: Segregation | null) {
    setInterns((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, segregation: v };
        if (v === "Terminated" || v === "Relocated")
          updated.sheetStatus = "Black";
        return updated;
      }),
    );
  }
  function setName(id: string, name: string) {
    setInterns((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  }
  function setEmail(id: string, email: string) {
    setInterns((prev) => prev.map((p) => (p.id === id ? { ...p, email } : p)));
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-extrabold">Intern Tracker</h2>
            <p className="text-sm text-muted-foreground">
              Overview and management of interns and sheet status.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportToCsv(filtered)}>
              Export CSV (filtered)
            </Button>
            <Button
              className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white"
              onClick={() =>
                setInterns((prev) => [...generateSeedInterns(50), ...prev])
              }
            >
              + Add 50 Blank Rows
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <SummaryCard
            label="Total Green sheets"
            value={summary.green}
            color="emerald"
          />
          <SummaryCard
            label="Total Red sheets"
            value={summary.red}
            color="rose"
          />
          <SummaryCard
            label="Total Black sheets"
            value={summary.black}
            color="zinc"
          />
          <SummaryCard
            label="Active vs Inactive"
            value={`${summary.active} / ${summary.inactive}`}
            color="sky"
          />
          <SummaryCard
            label="Excel Yes/No"
            value={`${summary.excelYes} / ${summary.excelNo}`}
            color="amber"
          />
          <SummaryCard
            label="Repurposed Yes/No"
            value={`${summary.repurposedYes} / ${summary.repurposedNo}`}
            color="fuchsia"
          />
        </div>

        {/* Filters row */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={filterSheet} onValueChange={setFilterSheet}>
            <SelectTrigger>
              <SelectValue placeholder="Sheet status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Sheets</SelectItem>
              <SelectItem value="Green">Green</SelectItem>
              <SelectItem value="Red">Red</SelectItem>
              <SelectItem value="Black">Black</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPerf} onValueChange={setFilterPerf}>
            <SelectTrigger>
              <SelectValue placeholder="Performance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Good">Good</SelectItem>
              <SelectItem value="Weak">Weak</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto flex items-center gap-2">
            <div className="text-sm text-muted-foreground">Rows per page</div>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card overflow-auto">
        <Table className="table-auto">
          <TableHeader>
            <TableRow>
              <TableHead className="w-72">Intern Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Excel Submitted</TableHead>
              <TableHead>AI Chat Team</TableHead>
              <TableHead>Data Mining GC</TableHead>
              <TableHead>Speakers Count</TableHead>
              <TableHead>Speakers Progress</TableHead>
              <TableHead>Performance</TableHead>
              <TableHead>Segregation</TableHead>
              <TableHead>Sheet Status</TableHead>
              <TableHead>Data Repurposed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((i) => (
              <TableRow
                key={i.id}
                className={cn(
                  i.performance === "Good" ? "bg-purple-50" : "",
                  i.performance === "Weak" ? "bg-amber-50" : "",
                )}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-8 w-8 shrink-0 rounded-full text-white grid place-items-center text-sm font-bold"
                      style={{
                        backgroundColor: `hsl(${stringToHue(i.name || i.id)}, 65%, 45%)`,
                      }}
                    >
                      {initials(i.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <input
                        placeholder="Full name"
                        value={i.name ?? ""}
                        onChange={(e) => setName(i.id, e.target.value)}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                      />
                      <input
                        type="email"
                        placeholder="Email (optional)"
                        value={i.email ?? ""}
                        onChange={(e) => setEmail(i.id, e.target.value)}
                        className="mt-1 w-48 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <Select
                    value={i.statusActivity}
                    onValueChange={(v) => setStatusActivity(i.id, v as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">
                        <span className="text-emerald-600 font-semibold">
                          A
                        </span>{" "}
                        Active
                      </SelectItem>
                      <SelectItem value="Inactive">
                        <span className="text-rose-600 font-semibold">I</span>{" "}
                        Inactive
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>

                <TableCell>
                  <Select
                    value={i.excelSubmitted}
                    onValueChange={(v) => setExcelSubmitted(i.id, v as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">
                        <span className="text-emerald-600">Yes</span>
                      </SelectItem>
                      <SelectItem value="No">
                        <span className="text-rose-600">No</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>

                <TableCell>
                  <button
                    onClick={() => toggleAiChat(i.id)}
                    className="rounded px-2 py-1 text-sm"
                    aria-label="toggle ai chat"
                  >
                    {i.aiChatAdded ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <X className="h-4 w-4 text-rose-600" />
                    )}
                  </button>
                </TableCell>

                <TableCell>
                  <button
                    onClick={() => toggleDataMining(i.id)}
                    className="rounded px-2 py-1 text-sm"
                    aria-label="toggle data mining"
                  >
                    {i.dataMiningGC ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <X className="h-4 w-4 text-rose-600" />
                    )}
                  </button>
                </TableCell>

                <TableCell>
                  <Input
                    type="number"
                    className="w-24"
                    value={i.speakersCount}
                    onChange={(e) =>
                      updateSpeakers(i.id, Number(e.target.value || 0))
                    }
                  />
                </TableCell>

                <TableCell>
                  <div className="w-36">
                    <div className="h-2 w-full rounded bg-muted">
                      <div
                        className={"h-2 rounded bg-emerald-500"}
                        style={{
                          width: `${Math.min(100, Math.round((i.speakersCount / i.speakersTarget) * 100))}%`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {i.speakersCount}/{i.speakersTarget}{" "}
                      {i.speakersCount >= i.speakersTarget ? "(Complete)" : ""}
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <Select
                    value={i.performance}
                    onValueChange={(v) => setPerformance(i.id, v as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Good">Good</SelectItem>
                      <SelectItem value="Weak">Weak</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>

                <TableCell>
                  <Select
                    value={i.segregation ?? "None"}
                    onValueChange={(v) =>
                      setSegregation(
                        i.id,
                        (v as any) === "None" ? null : (v as any),
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="None">None</SelectItem>
                      <SelectItem value="Resign">Resign</SelectItem>
                      <SelectItem value="Warning">Warning</SelectItem>
                      <SelectItem value="Terminated">Terminated</SelectItem>
                      <SelectItem value="Relocated">Relocated</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>

                <TableCell>
                  <Select
                    value={i.sheetStatus}
                    onValueChange={(v) => setSheetStatus(i.id, v as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Green">
                        <span className="text-emerald-600">●</span> Green
                      </SelectItem>
                      <SelectItem value="Red">
                        <span className="text-rose-600">●</span> Red
                      </SelectItem>
                      <SelectItem value="Black">
                        <span className="text-zinc-900">●</span> Black
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>

                <TableCell>
                  {i.sheetStatus === "Black" ? (
                    <Select
                      value={i.dataRepurposed}
                      onValueChange={(v) => setDataRepurposed(i.id, v as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">
                          <span className="text-emerald-600">Yes</span>
                        </SelectItem>
                        <SelectItem value="No">
                          <span className="text-rose-600">No</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-sm text-muted-foreground">—</div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination controls */}
        <div className="flex items-center justify-between p-4">
          <div className="text-sm text-muted-foreground">
            Showing {paginated.length} of {filtered.length} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </Button>
            <div className="px-3">
              Page {page} / {totalPages}
            </div>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  const gradients: Record<string, string> = {
    emerald: "from-emerald-400 to-teal-400",
    rose: "from-rose-400 to-rose-600",
    zinc: "from-zinc-400 to-zinc-700",
    sky: "from-sky-400 to-cyan-400",
    amber: "from-amber-400 to-orange-400",
    fuchsia: "from-fuchsia-400 to-pink-500",
  };
  return (
    <div className="rounded-md border bg-background p-3">
      <div
        className={
          "h-1 w-full rounded-md bg-gradient-to-r " +
          (gradients[color] ?? gradients.emerald)
        }
      />
      <div className="mt-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-1 font-bold text-xl">{value}</div>
      </div>
    </div>
  );
}
