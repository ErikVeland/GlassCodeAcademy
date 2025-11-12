"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import type { AdminLesson, AdminModule, AdminQuiz } from "@/types/admin";
import { useBackendReadiness } from "@/hooks/useBackendReadiness";

// Types for user management
type AdminUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  userRoles: { roleId: number; role: { id: number; name: string } }[];
};

type AdminRole = {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
};

// Types for statistics
type StatsData = {
  totalUsers: number;
  totalModules: number;
  totalLessons: number;
  totalQuizzes: number;
  activeUsers: number;
  userGrowth: { date: string; count: number }[];
  moduleDistribution: { name: string; value: number }[];
};

export default function AdminDashboard() {
  const [lessons, setLessons] = useState<AdminLesson[]>([]);
  const [modules, setModules] = useState<AdminModule[]>([]);
  const [quizzes, setQuizzes] = useState<AdminQuiz[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const pathname = usePathname();
  const {
    isReady: backendReady,
    isLoading: backendLoading,
    error: backendError,
    retryCount,
  } = useBackendReadiness({ enabled: pathname !== "/" });
  const showBackendStatus =
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_SHOW_BACKEND_STATUS === "1";

  const [searchQuery, setSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<number | "">("");
  const [assigningRole, setAssigningRole] = useState(false);
  const [roleAssignmentError, setRoleAssignmentError] = useState<string | null>(
    null,
  );

  const MODULES_CACHE_KEY = "admin_modules_cache";

  const readModulesCache = useCallback((): {
    data: AdminModule[];
    timestamp: number;
  } | null => {
    try {
      const raw =
        typeof window !== "undefined"
          ? localStorage.getItem(MODULES_CACHE_KEY)
          : null;
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { data: unknown; timestamp: number };
      if (!parsed || !Array.isArray(parsed.data)) return null;
      const valid = (parsed.data as unknown[]).every(
        (m) => m && typeof (m as AdminModule).id === "number",
      );
      if (!valid) return null;
      return {
        data: parsed.data as AdminModule[],
        timestamp: parsed.timestamp,
      };
    } catch {
      return null;
    }
  }, []);

  const writeModulesCache = useCallback((data: AdminModule[]) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          MODULES_CACHE_KEY,
          JSON.stringify({ data, timestamp: Date.now() }),
        );
      }
    } catch {
      // Ignore cache write failures
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);

      // In a real implementation, we would fetch actual stats from the backend
      // For now, we'll simulate the data
      const simulatedStats: StatsData = {
        totalUsers: users.length,
        totalModules: modules.length,
        totalLessons: lessons.length,
        totalQuizzes: quizzes.length,
        activeUsers: users.filter((u) => u.isActive).length,
        userGrowth: [
          { date: "2023-01", count: 10 },
          { date: "2023-02", count: 25 },
          { date: "2023-03", count: 45 },
          { date: "2023-04", count: 78 },
          { date: "2023-05", count: 120 },
          { date: "2023-06", count: 180 },
        ],
        moduleDistribution: modules.slice(0, 5).map((module) => ({
          name:
            module.title.length > 15
              ? `${module.title.substring(0, 15)}...`
              : module.title,
          value: Math.floor(Math.random() * 100) + 10,
        })),
      };

      setStats(simulatedStats);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setStatsLoading(false);
    }
  }, [users, modules, lessons, quizzes]);

  const fetchData = useCallback(
    async (opts?: { silent?: boolean }) => {
      try {
        // Check if user is authenticated
        if (status !== "authenticated") {
          return;
        }
        const silent = Boolean(opts?.silent);
        if (silent) setRefreshing(true);
        else setLoading(true);
        setError(null);
        // Use the API base URL from environment variables
        const apiBase =
          process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

        // Fetch modules from backend
        const modulesRes = await fetch(`${apiBase}/api/modules`, {
          cache: "no-store",
        });
        if (!modulesRes.ok) {
          throw new Error(`Failed to fetch modules: ${modulesRes.status}`);
        }
        const modulesResult = await modulesRes.json();
        const nextModules = Array.isArray(modulesResult)
          ? (modulesResult as AdminModule[])
          : Array.isArray((modulesResult as { data?: unknown }).data)
            ? (modulesResult as { data: AdminModule[] }).data
            : [];
        setModules(nextModules);
        writeModulesCache(nextModules);

        // Fetch all lessons (note: backend doesn't have a "get all lessons" endpoint)
        // We'll need to fetch lessons per module, or create a new endpoint
        // For now, set empty array
        setLessons([]);

        // Fetch quizzes (note: backend doesn't have a "get all quizzes" endpoint)
        // For now, set empty array
        setQuizzes([]);

        if (silent) setRefreshing(false);
        else setLoading(false);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch data";
        setError(errorMessage);
        setLoading(false);
        setRefreshing(false);
        console.error("Admin dashboard fetch error:", err);
      }
    },
    [status, writeModulesCache],
  );

  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      setUsersError(null);

      // Fetch users
      const usersRes = await fetch("/api/admin/users", {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!usersRes.ok) {
        throw new Error(`Failed to fetch users: ${usersRes.status}`);
      }

      const usersResult = await usersRes.json();
      const usersData = Array.isArray(usersResult.data) ? usersResult.data : [];

      setUsers(usersData);

      // Fetch roles
      const rolesRes = await fetch("/api/admin/roles", {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!rolesRes.ok) {
        throw new Error(`Failed to fetch roles: ${rolesRes.status}`);
      }

      const rolesResult = await rolesRes.json();
      const rolesData = Array.isArray(rolesResult.data) ? rolesResult.data : [];

      setRoles(rolesData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch users";
      setUsersError(errorMessage);
      console.error("Admin users fetch error:", err);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      const cached = readModulesCache();
      if (cached && Array.isArray(cached.data)) {
        setModules(cached.data);
        setLoading(false);
        void fetchData({ silent: true });
      } else {
        void fetchData();
      }

      // Fetch users and roles
      void fetchUsers();
    }
  }, [fetchData, status, router, readModulesCache, fetchUsers]);

  useEffect(() => {
    if (users.length > 0 && modules.length > 0) {
      void fetchStats();
    }
  }, [users, modules, lessons, quizzes, fetchStats]);

  const filteredModules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return modules;
    return modules.filter((m) =>
      [m.title, m.slug, String(m.order)].some((v) =>
        String(v).toLowerCase().includes(q),
      ),
    );
  }, [modules, searchQuery]);

  const filteredUsers = useMemo(() => {
    const q = userSearchQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.email, u.firstName, u.lastName].some((v) =>
        String(v).toLowerCase().includes(q),
      ),
    );
  }, [users, userSearchQuery]);

  const handleEditLesson = (id: number) => {
    router.push(`/admin/lessons/${id}/edit`);
  };

  const handleEditModule = (id: number) => {
    router.push(`/admin/modules/${id}/edit`);
  };

  const handleEditQuiz = (id: number) => {
    router.push(`/admin/quizzes/${id}/edit`);
  };

  const handleAssignRole = (user: AdminUser) => {
    setSelectedUser(user);
    setShowRoleModal(true);
    setSelectedRole("");
    setRoleAssignmentError(null);
  };

  const handleRoleAssignment = async () => {
    if (!selectedUser || selectedRole === "") return;

    try {
      setAssigningRole(true);
      setRoleAssignmentError(null);

      const response = await fetch("/api/admin/users/roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          roleId: selectedRole,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to assign role");
      }

      // Refresh users data
      await fetchUsers();

      // Close modal
      setShowRoleModal(false);
      setSelectedUser(null);
      setSelectedRole("");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to assign role";
      setRoleAssignmentError(errorMessage);
    } finally {
      setAssigningRole(false);
    }
  };

  const handleRemoveRole = async (userId: number, roleId: number) => {
    try {
      const response = await fetch("/api/admin/users/roles", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          roleId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to remove role");
      }

      // Refresh users data
      await fetchUsers();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to remove role";
      setUsersError(errorMessage);
      setTimeout(() => setUsersError(null), 3000);
    }
  };

  // Simple bar chart component
  const BarChart = ({ data }: { data: { name: string; value: number }[] }) => {
    const maxValue = Math.max(...data.map((item) => item.value), 1);

    return (
      <div className="flex items-end h-32 gap-2 mt-4">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div className="text-xs text-muted mb-1">{item.value}</div>
            <div
              className="w-full bg-primary rounded-t hover:opacity-75 transition-opacity"
              style={{ height: `${(item.value / maxValue) * 100}%` }}
            />
            <div className="text-xs text-muted mt-1 text-center truncate w-full">
              {item.name}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Simple line chart component
  const LineChart = ({ data }: { data: { date: string; count: number }[] }) => {
    const maxValue = Math.max(...data.map((item) => item.count), 1);

    return (
      <div className="mt-4">
        <div className="flex items-end h-32 gap-1 border-b border-l border-border pb-2 pl-2">
          {data.map((item, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div
                className="w-full bg-gradient-to-t from-primary to-primary/50 rounded-t"
                style={{ height: `${(item.count / maxValue) * 100}%` }}
              />
              <div className="text-xs text-muted mt-1 transform -rotate-45 origin-left">
                {item.date}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-bg py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-fg mb-8">Admin Dashboard</h1>
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
            <p className="text-lg text-muted mt-4">Loading data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-fg mb-8">Admin Dashboard</h1>
            <div className="glass-card bg-danger/10 border-danger/20 p-6">
              <p className="text-danger">{error}</p>
              <button
                onClick={() => {
                  void fetchData();
                }}
                className="mt-4 px-4 py-2 bg-danger text-danger-fg rounded-md hover:opacity-90 transition-opacity"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {showBackendStatus && pathname !== "/" && !backendReady && (
          <div
            role="status"
            aria-live="polite"
            className="mb-6 glass-card p-3 border border-border shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span
                className="inline-block h-4 w-4 rounded-full border-2 border-border border-t-primary animate-spin"
                aria-hidden="true"
              />
              <p className="text-sm text-fg">
                {backendLoading
                  ? "Connecting to backend…"
                  : backendError
                    ? "Backend not reachable. Showing local content."
                    : "Backend connected."}
              </p>
              {backendError && (
                <span className="ml-auto text-xs text-muted">
                  {retryCount > 0 ? `Retries: ${retryCount}` : ""}
                </span>
              )}
            </div>
          </div>
        )}
        {(() => {
          const authError = searchParams?.get("error");
          return authError ? (
            <div
              className="mb-6 glass-card bg-danger/10 border-danger/20 p-4"
              role="alert"
              aria-live="polite"
            >
              <p className="text-danger">Authentication error: {authError}</p>
            </div>
          ) : null;
        })()}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-fg">Admin Dashboard</h1>
          <p className="mt-2 text-lg text-muted">
            Manage your GlassCode Academy content
          </p>
          {status !== "authenticated" && (
            <div
              className="mt-6 glass-card bg-warning/10 border-warning/20 p-4"
              role="alert"
              aria-live="polite"
            >
              <p className="text-warning">
                You are not signed in. Please login to manage content.
              </p>
              <button
                onClick={() => router.push("/login")}
                className="mt-3 px-4 py-2 bg-warning text-warning-fg rounded-md hover:opacity-90 transition-opacity"
                aria-label="Go to Login"
              >
                Go to Login
              </button>
            </div>
          )}
          {refreshing && (
            <div className="mt-4 text-sm text-muted" aria-live="polite">
              Refreshing data…
            </div>
          )}
        </div>

        {/* Enhanced Stats Overview with Graphs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="glass-card">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary/10 p-3 rounded-full">
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-fg">Total Users</h3>
                <p className="text-2xl font-semibold text-primary">
                  {statsLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    stats?.totalUsers || 0
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-success/10 p-3 rounded-full">
                <svg
                  className="h-6 w-6 text-success"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-fg">Modules</h3>
                <p className="text-2xl font-semibold text-success">
                  {statsLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    stats?.totalModules || 0
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-warning/10 p-3 rounded-full">
                <svg
                  className="h-6 w-6 text-warning"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-fg">Lessons</h3>
                <p className="text-2xl font-semibold text-warning">
                  {statsLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    stats?.totalLessons || 0
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-info/10 p-3 rounded-full">
                <svg
                  className="h-6 w-6 text-info"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-fg">Quizzes</h3>
                <p className="text-2xl font-semibold text-info">
                  {statsLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    stats?.totalQuizzes || 0
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            {/* User Growth Chart */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-fg mb-4">
                User Growth
              </h3>
              <div className="text-sm text-muted mb-2">New users per month</div>
              <LineChart data={stats.userGrowth} />
            </div>

            {/* Module Distribution Chart */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-fg mb-4">
                Top Modules
              </h3>
              <div className="text-sm text-muted mb-2">Lesson distribution</div>
              <BarChart data={stats.moduleDistribution} />
            </div>
          </div>
        )}

        {/* Active Users Card */}
        <div className="glass-card p-6 mb-12">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-fg">Active Users</h3>
            <span className="text-2xl font-bold text-primary">
              {statsLoading ? (
                <span className="animate-pulse">...</span>
              ) : (
                stats?.activeUsers || 0
              )}
            </span>
          </div>
          <div className="mt-2 w-full bg-surface-alt rounded-full h-2.5">
            <div
              className="bg-primary h-2.5 rounded-full"
              style={{
                width:
                  stats && stats.totalUsers > 0
                    ? `${(stats.activeUsers / stats.totalUsers) * 100}%`
                    : "0%",
              }}
            ></div>
          </div>
          <div className="mt-2 text-sm text-muted">
            {stats && stats.totalUsers > 0
              ? `${Math.round((stats.activeUsers / stats.totalUsers) * 100)}% of total users`
              : "0% of total users"}
          </div>
        </div>

        {/* Content Management Sections */}
        <div className="space-y-12">
          {/* Users Section */}
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-semibold text-fg">Users</h2>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="w-64">
                  <label htmlFor="user-search" className="sr-only">
                    Search users
                  </label>
                  <input
                    id="user-search"
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Search users…"
                    className="w-full px-3 py-2 rounded-md bg-surface-alt border border-border text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="Search users"
                  />
                </div>
                <button
                  onClick={() => {
                    void fetchUsers();
                  }}
                  className="px-3 py-2 rounded-md bg-primary text-primary-fg hover:opacity-90 transition-opacity"
                  aria-label="Refresh users"
                >
                  Refresh
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table role="table" className="min-w-full divide-y divide-border">
                <caption className="sr-only">List of users</caption>
                <thead className="bg-surface-alt">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider"
                    >
                      Roles
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider"
                    >
                      Last Login
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-border">
                  {usersLoading &&
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr
                        key={`users-skeleton-${idx}`}
                        className="animate-pulse"
                      >
                        <td className="px-6 py-4">
                          <div className="h-4 bg-surface-alt rounded w-40" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-surface-alt rounded w-32" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-surface-alt rounded w-24" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-6 bg-surface-alt rounded w-20" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-surface-alt rounded w-32" />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="h-4 bg-surface-alt rounded w-10 ml-auto" />
                        </td>
                      </tr>
                    ))}
                  {!usersLoading && filteredUsers.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-muted"
                      >
                        No users found
                        {userSearchQuery ? " for your search." : "."}
                      </td>
                    </tr>
                  )}
                  {!usersLoading &&
                    filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-surface-alt transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-fg">
                            {user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-muted">
                            {user.firstName} {user.lastName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {user.userRoles && user.userRoles.length > 0 ? (
                              user.userRoles.map((userRole) => (
                                <span
                                  key={userRole.roleId}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30"
                                >
                                  {userRole.role.name}
                                  <button
                                    onClick={() =>
                                      handleRemoveRole(user.id, userRole.roleId)
                                    }
                                    className="ml-1 text-primary hover:text-primary/80"
                                    aria-label={`Remove ${userRole.role.name} role`}
                                  >
                                    ×
                                  </button>
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-muted">
                                No roles
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? "bg-success/20 text-success border border-success/30" : "bg-danger/20 text-danger border border-danger/30"}`}
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-muted">
                            {user.lastLoginAt
                              ? new Date(user.lastLoginAt).toLocaleDateString()
                              : "Never"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleAssignRole(user)}
                            className="text-primary hover:text-primary/80 transition-colors"
                            aria-label={`Assign role to ${user.email}`}
                          >
                            Assign Role
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {usersError && (
              <div className="px-6 py-4 bg-danger/10 border-t border-danger/20 text-danger">
                {usersError}
              </div>
            )}
          </div>

          {/* Modules Section */}
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-semibold text-fg">Modules</h2>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="w-64">
                  <label htmlFor="module-search" className="sr-only">
                    Search modules
                  </label>
                  <input
                    id="module-search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search modules…"
                    className="w-full px-3 py-2 rounded-md bg-surface-alt border border-border text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="Search modules"
                  />
                </div>
                <button
                  onClick={() => {
                    void fetchData();
                  }}
                  className="px-3 py-2 rounded-md bg-primary text-primary-fg hover:opacity-90 transition-opacity"
                  aria-label="Refresh modules"
                >
                  Refresh
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table role="table" className="min-w-full divide-y divide-border">
                <caption className="sr-only">List of modules</caption>
                <thead className="bg-surface-alt">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider"
                    >
                      Title
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider"
                    >
                      Slug
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider"
                    >
                      Order
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider"
                    >
                      Published
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-border">
                  {loading &&
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={`skeleton-${idx}`} className="animate-pulse">
                        <td className="px-6 py-4">
                          <div className="h-4 bg-surface-alt rounded w-40" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-surface-alt rounded w-32" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-surface-alt rounded w-12" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-6 bg-surface-alt rounded w-20" />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="h-4 bg-surface-alt rounded w-10 ml-auto" />
                        </td>
                      </tr>
                    ))}
                  {!loading && filteredModules.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-muted"
                      >
                        No modules found
                        {searchQuery ? " for your search." : "."}
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    filteredModules.map((module) => (
                      <tr
                        key={module.id}
                        className="hover:bg-surface-alt transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-fg">
                            {module.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-muted">
                            {module.slug}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-muted">
                            {module.order}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${module.isPublished ? "bg-success/20 text-success border border-success/30" : "bg-danger/20 text-danger border border-danger/30"}`}
                          >
                            {module.isPublished ? "Published" : "Draft"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditModule(module.id)}
                            className="text-primary hover:text-primary/80 transition-colors"
                            aria-label={`Edit module ${module.title}`}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lessons Section */}
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-fg">Lessons</h2>
            </div>
            <div className="overflow-x-auto">
              <table role="table" className="min-w-full divide-y divide-border">
                <caption className="sr-only">List of lessons</caption>
                <thead className="bg-surface-alt">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider"
                    >
                      Title
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider"
                    >
                      Slug
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider"
                    >
                      Order
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider"
                    >
                      Difficulty
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider"
                    >
                      Published
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-border">
                  {loading &&
                    Array.from({ length: 3 }).map((_, idx) => (
                      <tr key={`lessons-skel-${idx}`} className="animate-pulse">
                        <td className="px-6 py-4">
                          <div className="h-4 bg-surface-alt rounded w-40" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-surface-alt rounded w-32" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-surface-alt rounded w-12" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-surface-alt rounded w-24" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-6 bg-surface-alt rounded w-20" />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="h-4 bg-surface-alt rounded w-10 ml-auto" />
                        </td>
                      </tr>
                    ))}
                  {!loading && lessons.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-muted"
                      >
                        No lessons available.
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    lessons.map((lesson) => (
                      <tr key={lesson.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-fg">
                            {lesson.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-muted">
                            {lesson.slug}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-muted">
                            {lesson.order}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-muted">
                            {lesson.difficulty}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${lesson.isPublished ? "bg-success/20 text-success border border-success/30" : "bg-danger/20 text-danger border border-danger/30"}`}
                          >
                            {lesson.isPublished ? "Published" : "Draft"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditLesson(lesson.id)}
                            className="text-primary hover:text-primary/80 mr-4"
                            aria-label={`Edit lesson ${lesson.title}`}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quizzes Section */}
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-fg">Quizzes</h2>
            </div>
            <div className="overflow-x-auto">
              <table role="table" className="min-w-full divide-y divide-border">
                <caption className="sr-only">List of quizzes</caption>
                <thead className="bg-surface-alt">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider"
                    >
                      Question
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider"
                    >
                      Topic
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider"
                    >
                      Type
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider"
                    >
                      Difficulty
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-border">
                  {loading &&
                    Array.from({ length: 3 }).map((_, idx) => (
                      <tr key={`quizzes-skel-${idx}`} className="animate-pulse">
                        <td className="px-6 py-4">
                          <div className="h-4 bg-surface-alt rounded w-64" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-surface-alt rounded w-24" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-surface-alt rounded w-20" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-surface-alt rounded w-20" />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="h-4 bg-surface-alt rounded w-10 ml-auto" />
                        </td>
                      </tr>
                    ))}
                  {!loading && quizzes.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-muted"
                      >
                        No quizzes available.
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    quizzes.slice(0, 10).map((quiz) => (
                      <tr key={quiz.id}>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-fg truncate max-w-xs">
                            {quiz.question}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-muted">{quiz.topic}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-muted">
                            {quiz.questionType}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-muted">
                            {quiz.difficulty}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditQuiz(quiz.id)}
                            className="text-primary hover:text-primary/80 mr-4"
                            aria-label={`Edit quiz ${quiz.id}`}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Role Assignment Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-md w-full rounded-lg shadow-xl">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-lg font-medium text-fg">
                Assign Role to {selectedUser.email}
              </h3>
            </div>
            <div className="px-6 py-4">
              <div className="mb-4">
                <label
                  htmlFor="role-select"
                  className="block text-sm font-medium text-fg mb-2"
                >
                  Select Role
                </label>
                <select
                  id="role-select"
                  value={selectedRole}
                  onChange={(e) =>
                    setSelectedRole(Number(e.target.value) || "")
                  }
                  className="w-full px-3 py-2 rounded-md bg-surface-alt border border-border text-fg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              {roleAssignmentError && (
                <div className="mb-4 p-3 bg-danger/10 border border-danger/20 text-danger rounded">
                  {roleAssignmentError}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedUser(null);
                  setSelectedRole("");
                  setRoleAssignmentError(null);
                }}
                className="px-4 py-2 rounded-md bg-surface-alt text-fg hover:opacity-90 transition-opacity"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleAssignment}
                disabled={selectedRole === "" || assigningRole}
                className="px-4 py-2 rounded-md bg-primary text-primary-fg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {assigningRole ? "Assigning..." : "Assign Role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
