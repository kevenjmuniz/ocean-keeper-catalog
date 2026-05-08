import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Fish, LayoutDashboard, Package, Tags, Upload, LogOut } from "lucide-react";
import logoM2i from "@/assets/logo-m2i.png";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const links = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/produtos", label: "Produtos", icon: Package },
  { to: "/admin/categorias", label: "Categorias", icon: Tags },
  { to: "/admin/importar", label: "Importar", icon: Upload },
];

function AdminLayout() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Carregando...</div>;
  }

  if (user && !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
          <h1 className="text-xl font-semibold">Acesso restrito</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua conta ({user.email}) ainda não tem permissão de administrador. Solicite acesso ao gestor.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            User ID: <code className="rounded bg-muted px-1.5 py-0.5">{user.id}</code>
          </p>
          <button
            onClick={() => signOut().then(() => navigate({ to: "/login" }))}
            className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-sidebar text-sidebar-foreground md:block">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-ocean">
            <Fish className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <div className="text-sm font-semibold">M2i Admin</div>
            <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">Painel</div>
          </div>
        </div>
        <nav className="mt-4 space-y-1 px-3">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.exact }}
              activeProps={{ className: "bg-sidebar-accent text-sidebar-foreground" }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-smooth"
            >
              <l.icon className="h-4 w-4" /> {l.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 left-0 right-0 px-3">
          <button
            onClick={() => signOut().then(() => navigate({ to: "/" }))}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent transition-smooth"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-4 px-6">
            <div className="md:hidden flex items-center gap-2">
              <Fish className="h-5 w-5 text-primary" /> <span className="font-semibold">M2i Admin</span>
            </div>
            <div className="hidden md:block text-sm text-muted-foreground">
              Olá, <span className="text-foreground font-medium">{user?.email}</span>
            </div>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              Ver site →
            </Link>
          </div>
          <nav className="md:hidden flex gap-1 overflow-x-auto px-3 pb-3">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                activeOptions={{ exact: l.exact }}
                activeProps={{ className: "bg-primary text-primary-foreground" }}
                className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-medium whitespace-nowrap"
              >
                <l.icon className="h-3.5 w-3.5" /> {l.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="p-6 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
