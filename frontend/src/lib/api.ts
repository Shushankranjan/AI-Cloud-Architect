import {
  ApiError,
  type ApiErrorBody,
  type ChatResponse,
  type ExamplePrompt,
  type ExportFormat,
  type ExportResponse,
  type GenerateResponse,
  type RefineRequest,
  type RequirementsInput,
  type SelectResponse,
  type Session,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(0, "network_error", `Cannot reach API at ${BASE_URL}`);
  }
  if (!res.ok) {
    let body: ApiErrorBody | null = null;
    try {
      body = (await res.json()) as ApiErrorBody;
    } catch {
      /* non-JSON error */
    }
    throw new ApiError(
      res.status,
      body?.error?.code ?? "unknown_error",
      body?.error?.message ?? `HTTP ${res.status}`,
      body?.error?.details,
    );
  }
  return (await res.json()) as T;
}

export const api = {
  health: () =>
    request<{ status: string; version: string; mode: string }>("/api/health"),

  examples: () => request<ExamplePrompt[]>("/api/architect/examples"),

  generate: (requirements: RequirementsInput) =>
    request<GenerateResponse>("/api/architect/generate", {
      method: "POST",
      body: JSON.stringify(requirements),
    }),

  session: (sessionId: string) =>
    request<Session>(`/api/architect/session/${sessionId}`),

  select: (sessionId: string, optionId: string) =>
    request<SelectResponse>("/api/architect/select", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, option_id: optionId }),
    }),

  chat: (sessionId: string, message: string) =>
    request<ChatResponse>("/api/architect/chat", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, message }),
    }),

  refine: (payload: RefineRequest) =>
    request<GenerateResponse>("/api/architect/refine", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  export: (sessionId: string, format: ExportFormat) =>
    request<ExportResponse>("/api/architect/export", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, format }),
    }),
};
