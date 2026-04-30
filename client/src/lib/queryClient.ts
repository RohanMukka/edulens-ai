import { QueryClient, QueryFunction } from "@tanstack/react-query";

const API_BASE = (() => {
  // If the client is served from a different localhost port (vite dev),
  // point API requests to the backend on port 5000 so cookies/sessions
  // are set by the correct origin during local development.
  try {
    if (typeof window !== "undefined") {
      const port = window.location.port;
      if (port && port !== "5000") return "http://localhost:5000";
    }
  } catch (e) {
    // ignore in non-browser contexts
  }
  return "";
})();

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let text = (await res.text()) || res.statusText;
    try {
      const json = JSON.parse(text);
      if (json.message) text = json.message;
    } catch (e) {
      // Ignore JSON parse errors and use the raw text
    }
    throw new Error(text);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(`${API_BASE}${url}`, {
    method,
    credentials: "include",
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(`${API_BASE}${queryKey.join("/")}`, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
