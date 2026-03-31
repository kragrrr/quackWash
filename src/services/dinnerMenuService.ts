import type { DinnerMenu, DinnerMenuType } from "@/types/dinnerMenu";

interface DinnerMenuBasePayload {
  type: DinnerMenuType;
  title?: string;
  dateLabel?: string;
}

interface TextMenuPayload extends DinnerMenuBasePayload {
  type: "text";
  text: string;
}

interface FileMenuPayload extends DinnerMenuBasePayload {
  type: "image" | "pdf";
  fileName: string;
  mimeType: string;
  fileBase64: string;
}

export type UpdateDinnerMenuPayload = TextMenuPayload | FileMenuPayload;

export async function fetchDinnerMenu(viewerPassword: string): Promise<DinnerMenu> {
  const res = await fetch("/api/dev/dinner-menu", {
    headers: {
      "x-dev-viewer-password": viewerPassword,
    },
  });

  if (!res.ok) {
    throw new Error(res.status === 401 ? "Invalid viewer password." : "Failed to load dinner menu.");
  }

  return res.json();
}

export async function updateDinnerMenu(
  adminPassword: string,
  payload: UpdateDinnerMenuPayload
): Promise<DinnerMenu> {
  const res = await fetch("/api/dev/dinner-menu", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-dev-admin-password": adminPassword,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const errorMessage = typeof data?.error === "string" ? data.error : "Failed to update dinner menu.";
    throw new Error(errorMessage);
  }

  return res.json();
}

