import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Student } from "@shared/schema";
import { apiRequest } from "./queryClient";

interface AuthContextType {
  student: Student | null;
  login: (email: string) => Promise<Student>;
  register: (name: string, email: string, role: string) => Promise<Student>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);

  const login = useCallback(async (email: string) => {
    const res = await apiRequest("POST", "/api/auth/login", { email });
    const data = await res.json();
    setStudent(data);
    return data;
  }, []);

  const register = useCallback(async (name: string, email: string, role: string) => {
    const res = await apiRequest("POST", "/api/auth/register", { name, email, role });
    const data = await res.json();
    setStudent(data);
    return data;
  }, []);

  const logout = useCallback(() => {
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
