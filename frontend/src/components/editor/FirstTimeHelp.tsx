import React from 'react';
import { ChevronDown, ChevronRight, HelpCircle, Link as LinkIcon, MousePointer, GitBranch, Type } from 'lucide-react';

type Props = {
  defaultOpen?: boolean;
  onAddStarterTemplate?: () => void;
};

export const FirstTimeHelp: React.FC<Props> = ({ defaultOpen = true, onAddStarterTemplate }) => {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <section className="bg-card border-b border-border">
      <div className="px-6 py-3">
        <button
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2 text-foreground">
            <HelpCircle className="w-5 h-5 text-primary" />
            <span className="font-medium">How to use the Visual Research Builder</span>
          </div>
          {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </button>

        {open && (
          <div className="mt-3 grid md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Type className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold">1) Add a block</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Use the left panel “Add Proof Blocks” and choose Text, Image, Video, Audio or Reference.
              </p>
            </div>

            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <MousePointer className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold">2) Edit details</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Double-click a block (or click “Open”) to set a Title, Description and its content.
              </p>
            </div>

            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <LinkIcon className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold">3) Connect the flow</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                New blocks auto-connect. Drag connection handles to change order (left = input, right = output).
              </p>
            </div>

            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <GitBranch className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold">4) Review the sequence</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                The “Ordered Blocks” list shows the path used for hashing and publishing.
              </p>
            </div>

            <div className="md:col-span-4 flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">
                Tip: you can drag blocks around, zoom with the controls, and use the sidebar to quickly open any block.
              </p>
              {onAddStarterTemplate && (
                <button
                  onClick={onAddStarterTemplate}
                  className="btn-secondary px-3 py-1.5 rounded-md text-sm"
                  aria-label="Add starter template"
                  title="Add starter template"
                >
                  Add Starter Template
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
