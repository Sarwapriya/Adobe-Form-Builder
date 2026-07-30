import { useBuilderStore, type WizardStep } from "../store/builderStore.ts";
import { UploadStep } from "./upload/UploadStep.tsx";
import { PreviewStep } from "./preview/PreviewStep.tsx";
import { ConfigureStep } from "./configure/ConfigureStep.tsx";
import { GenerateStep } from "./generate/GenerateStep.tsx";

const STEPS: { id: WizardStep; label: string }[] = [
  { id: "upload", label: "1. Upload" },
  { id: "preview", label: "2. Preview" },
  { id: "configure", label: "3. Configure" },
  { id: "generate", label: "4. Generate" },
];

export function AppShell() {
  const step = useBuilderStore((s) => s.step);
  const mapResult = useBuilderStore((s) => s.mapResult);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Form Builder</h1>
        <nav className="wizard-steps">
          {STEPS.map((s) => (
            <span key={s.id} className={`wizard-step${s.id === step ? " active" : ""}`}>
              {s.label}
            </span>
          ))}
        </nav>
      </header>

      {step === "upload" && <UploadStep />}
      {step === "preview" && mapResult && <PreviewStep />}
      {step === "configure" && mapResult && <ConfigureStep />}
      {step === "generate" && mapResult && <GenerateStep />}
    </div>
  );
}
