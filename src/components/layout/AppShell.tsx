import { Toolbar } from "./Toolbar";
import { FieldPalette } from "../palette/FieldPalette";
import { FieldList } from "../canvas/FieldList";
import { PropertyPanel } from "../propertyPanel/PropertyPanel";
import { LanguageSelector } from "../languageSelector/LanguageSelector";
import { PreviewPane } from "../preview/PreviewPane";

export function AppShell() {
  return (
    <div className="app-shell">
      <Toolbar />
      <div className="app-body">
        <aside className="app-col palette-col">
          <FieldPalette />
          <LanguageSelector />
        </aside>
        <main className="app-col canvas-col">
          <h3>Form</h3>
          <FieldList />
        </main>
        <aside className="app-col property-col">
          <PropertyPanel />
        </aside>
        <section className="app-col preview-col">
          <PreviewPane />
        </section>
      </div>
    </div>
  );
}
