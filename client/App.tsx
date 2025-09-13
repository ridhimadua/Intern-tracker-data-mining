import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
            <div className="container flex h-16 items-center justify-between">
              <Link to="/" className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600" />
                <span className="text-lg font-extrabold tracking-tight">Intern Tracker</span>
              </Link>
            </div>
          </header>
          <main className="container flex-1 py-8">
            <Routes>
              <Route path="/" element={<Index />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <footer className="border-t">
            <div className="container py-6 text-center text-sm text-muted-foreground">
              © {new Date().getFullYear()} Intern Tracker. All rights reserved.
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
