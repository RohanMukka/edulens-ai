import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { Student } from "@shared/schema";
import { apiRequest } from "./queryClient";

interface AuthContextType {
  student: Student | null;
  login: (email: string, password: string) => Promise<Student>;
  register: (name: string, email: string, password: string, role: string, educatorCode?: string) => Promise<Student>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);

  // Restore session on mount
  useEffect(() => {
    apiRequest("GET", "/api/auth/me")
      .then(res => res.json())
      .then(data => setStudent(data))
      .catch(() => {});
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/login", { email, password });
    const data = await res.json();
    setStudent(data);
    return data;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, role: string, educatorCode?: string) => {
    const res = await apiRequest("POST", "/api/auth/register", { name, email, password, role, educatorCode });
    const data = await res.json();
    setStudent(data);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch (e) {
      console.error("Logout failed", e);
    }
    setStudent(null);
  }, []);

  return (
    <AuthContext.Provider value={{ student, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
