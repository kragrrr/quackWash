import { useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import TopBar from "@/components/TopBar";
import DashboardAccordion from "@/components/DashboardAccordion";
import DuckDrawer from "@/components/DuckDrawer";
import PondDrawer from "@/components/PondDrawer";
import { useMachines } from "@/hooks/useMachines";
import { useTransport } from "@/hooks/useTransport";
import { useDinnerMenu } from "@/hooks/useDinnerMenu";
import { updateDinnerMenu } from "@/services/dinnerMenuService";
import type { Machine } from "@/data/mockData";
import type { DinnerMenuType } from "@/types/dinnerMenu";

const VIEWER_KEY = "dev-viewer-password";

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Failed to read file."));
        return;
      }
      const base64 = result.split(",")[1] || "";
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

export default function DevDashboard() {
  const [viewerPasswordInput, setViewerPasswordInput] = useState("");
  const [viewerPassword, setViewerPassword] = useState(() => sessionStorage.getItem(VIEWER_KEY) || "");

  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [duckDrawerOpen, setDuckDrawerOpen] = useState(false);
  const [pondDrawerOpen, setPondDrawerOpen] = useState(false);

  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [menuType, setMenuType] = useState<DinnerMenuType>("text");
  const [title, setTitle] = useState("What's for Dinner?");
  const [dateLabel, setDateLabel] = useState(new Date().toLocaleDateString());
  const [textMenu, setTextMenu] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const adminEditorRef = useRef<HTMLElement | null>(null);

  const queryClient = useQueryClient();
  const { data: machines = [], isLoading: isLoadingMachines } = useMachines();
  useTransport();

  const dinnerQuery = useDinnerMenu(viewerPassword, !!viewerPassword);
  const dinnerMenu = dinnerQuery.data ?? null;

  const authErrorMessage = dinnerQuery.error instanceof Error ? dinnerQuery.error.message : "";
  const authFailed = dinnerQuery.isError;

  const canShowDashboard = viewerPassword && !authFailed;

  const mobileHintDate = useMemo(() => new Date().toLocaleDateString(), []);

  const handleViewerLogin = () => {
    if (!viewerPasswordInput.trim()) {
      return;
    }
    setViewerPassword(viewerPasswordInput.trim());
    sessionStorage.setItem(VIEWER_KEY, viewerPasswordInput.trim());
  };

  const handleLogout = () => {
    sessionStorage.removeItem(VIEWER_KEY);
    setViewerPassword("");
    setViewerPasswordInput("");
  };

  const handleDuckTap = (machine: Machine) => {
    setSelectedMachine(machine);
    setDuckDrawerOpen(true);
  };

  const handleSaveMenu = async () => {
    if (!adminPassword.trim()) {
      toast.error("Admin password is required.");
      return;
    }

    try {
      setIsSaving(true);

      if (menuType === "text") {
        await updateDinnerMenu(adminPassword, {
          type: "text",
          title,
          dateLabel,
          text: textMenu,
        });
      } else {
        if (!uploadFile) {
          toast.error("Please choose a file first.");
          return;
        }

        const isValidImage = menuType === "image" && uploadFile.type.startsWith("image/");
        const isValidPdf = menuType === "pdf" && uploadFile.type === "application/pdf";
        if (!isValidImage && !isValidPdf) {
          toast.error("Uploaded file type does not match selected mode.");
          return;
        }

        const base64 = await fileToBase64(uploadFile);
        await updateDinnerMenu(adminPassword, {
          type: menuType,
          title,
          dateLabel,
          fileName: uploadFile.name,
          mimeType: uploadFile.type,
          fileBase64: base64,
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["dinner-menu"] });
      toast.success("Dinner menu updated.");
      setUploadFile(null);
      setTextMenu("");
      setIsAdminOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save dinner menu.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!canShowDashboard) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <TopBar notifications={0} />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="pixel-border bg-card p-4 w-full max-w-sm flex flex-col gap-3">
            <h2 className="font-display text-sm">Dev Dashboard Access</h2>
            <p className="text-sm text-muted-foreground">
              Enter the viewer password to open the `/dev` dashboard.
            </p>
            <input
              type="password"
              value={viewerPasswordInput}
              onChange={(e) => setViewerPasswordInput(e.target.value)}
              className="w-full border border-border bg-background p-2 text-sm"
              placeholder="Viewer password"
            />
            <button
              type="button"
              onClick={handleViewerLogin}
              className="pixel-btn px-3 py-2 bg-primary/20 text-sm"
            >
              Open /dev
            </button>
            {authFailed && (
              <p className="text-xs text-destructive">
                {authErrorMessage || "Unable to access /dev. Check password and backend server."}
              </p>
            )}
            {viewerPassword && dinnerQuery.isLoading && (
              <p className="text-xs text-muted-foreground">Checking access...</p>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar notifications={0} />
      <main className="flex-1 pb-20 overflow-y-auto w-full max-w-lg mx-auto hide-scrollbar px-2">
        <div className="flex justify-end pt-3">
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs underline text-muted-foreground"
          >
            Log out /dev
          </button>
        </div>
        <DashboardAccordion
          machines={machines}
          onShowMachineDetails={() => setPondDrawerOpen(true)}
          showDinnerSection={true}
          dinnerMenu={dinnerMenu}
          showDinnerAdminButton={true}
          onDinnerAdminClick={() => {
            setIsAdminOpen(true);
            setDateLabel(mobileHintDate);
            toast.info("Catering editor opened");
            setTimeout(() => {
              adminEditorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 80);
          }}
        />

        {isAdminOpen && (
          <section ref={adminEditorRef} className="pixel-border bg-card p-3 sm:p-4 mb-4">
            <h3 className="font-display text-sm mb-3">Catering Admin Editor</h3>
            <div className="grid gap-2">
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="border border-border bg-background p-2 text-sm"
                placeholder="Admin password"
              />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border border-border bg-background p-2 text-sm"
                placeholder="Menu title"
              />
              <input
                type="text"
                value={dateLabel}
                onChange={(e) => setDateLabel(e.target.value)}
                className="border border-border bg-background p-2 text-sm"
                placeholder="Date label"
              />
              <select
                value={menuType}
                onChange={(e) => setMenuType(e.target.value as DinnerMenuType)}
                className="border border-border bg-background p-2 text-sm"
              >
                <option value="text">Text</option>
                <option value="image">Image</option>
                <option value="pdf">PDF</option>
              </select>

              {menuType === "text" ? (
                <textarea
                  value={textMenu}
                  onChange={(e) => setTextMenu(e.target.value)}
                  className="border border-border bg-background p-2 text-sm min-h-32"
                  placeholder="Paste menu text here..."
                />
              ) : (
                <input
                  type="file"
                  accept={menuType === "image" ? "image/*,.heic,.heif" : "application/pdf"}
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  className="border border-border bg-background p-2 text-sm"
                />
              )}

              <button
                type="button"
                onClick={handleSaveMenu}
                disabled={isSaving}
                className="pixel-btn px-3 py-2 bg-primary/20 text-sm disabled:opacity-70"
              >
                {isSaving ? "Saving..." : "Save dinner menu"}
              </button>
            </div>
          </section>
        )}
      </main>

      <div
        className="fixed bottom-0 w-full max-w-lg mx-auto sm:left-1/2 sm:-translate-x-1/2 p-4 pb-6 flex items-center justify-center text-center"
        style={{
          background: "linear-gradient(to right, #1a2f3e, #2b3a4a)",
          borderTopLeftRadius: "24px",
          borderTopRightRadius: "24px",
          boxShadow: "0 -4px 10px rgba(0,0,0,0.2)",
        }}
      >
        <p
          className="text-xs text-white/50"
          style={{ fontFamily: '"Press Start 2P", monospace', fontSize: "0.55rem", lineHeight: "1.5" }}
        >
          This page is not affiliated with UOW or I-House.
        </p>
      </div>

      {!isLoadingMachines && (
        <>
          <DuckDrawer
            machine={selectedMachine}
            open={duckDrawerOpen}
            onOpenChange={setDuckDrawerOpen}
          />
          <PondDrawer
            machines={machines}
            open={pondDrawerOpen}
            onOpenChange={setPondDrawerOpen}
            onDuckClick={handleDuckTap}
          />
        </>
      )}
    </div>
  );
}

