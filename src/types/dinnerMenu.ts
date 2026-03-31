export type DinnerMenuType = "text" | "image" | "pdf";

export interface DinnerMenu {
  type: DinnerMenuType;
  title: string;
  dateLabel: string;
  text: string | null;
  filePath: string | null;
  mimeType: string | null;
  updatedAt: string;
}

