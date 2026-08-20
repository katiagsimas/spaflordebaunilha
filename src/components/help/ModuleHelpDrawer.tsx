import React, { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface HelpSection {
  title: string;
  text: string;
}

export interface HelpContent {
  moduleTitle: string;
  description: string;
  recommendedFlow?: string[];
  sections: HelpSection[];
  kaTip?: string;
}

export interface ModuleHelpDrawerProps {
  content: HelpContent;
  isOpen: boolean;
  onClose: () => void;
}

const tabs = ["O que é", "Como usar", "Campos"] as const;
type TabKey = (typeof tabs)[number];

export const ModuleHelpDrawer: React.FC<ModuleHelpDrawerProps> = ({
  content,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>("O que é");

  return (
    <div className="flex h-full">
      <div className="flex-1 min-w-0" />

      <div
        className={
          "overflow-hidden transition-all duration-300 ease-in-out flex-shrink-0 " +
          (isOpen ? "w-72" : "w-0")
        }
      >
        <div className="w-72 h-full bg-[#FFFDF9] border-l border-[#3D2F28]/10 flex flex-col">
          {/* Cabeçalho */}
          <div className="px-4 pt-4 pb-3 border-b border-[#C98A75]/30">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-['Cormorant_Garamond'] text-[#3D2F28] text-lg leading-tight">
                  {content.moduleTitle}
                </h2>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Central de Ajuda · Este módulo
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-[#3D2F28]/60 hover:text-[#3D2F28] hover:bg-[#3D2F28]/5 h-7 w-7 -mr-1 -mt-1 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1.5 px-3 pt-3 pb-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={
                  "text-xs px-3 py-1 rounded-full transition-colors cursor-pointer " +
                  (activeTab === tab
                    ? "bg-[#3D2F28] text-[#FFFDF9]"
                    : "border border-[#3D2F28]/20 text-[#3D2F28]/55 hover:border-[#3D2F28]/40 hover:text-[#3D2F28]/70")
                }
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Conteúdo */}
          <div className="flex-1 overflow-y-auto px-3 pb-3">
            {activeTab === "O que é" && (
              <div className="border-l-2 border-[#3D2F28] pl-3 bg-[#3D2F28]/5 rounded-r-md py-2 text-xs leading-relaxed text-[#2A1F1A]">
                {content.description}
              </div>
            )}

            {activeTab === "Como usar" && (
              <div>
                {content.recommendedFlow && content.recommendedFlow.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] uppercase text-muted-foreground mb-1.5 tracking-wide">
                      Fluxo recomendado
                    </p>
                    <div className="flex flex-wrap items-center gap-1">
                      {content.recommendedFlow.map((step, i) => (
                        <React.Fragment key={i}>
                          <span className="bg-[#3D2F28] text-[#FFFDF9] rounded-full text-[10px] px-2 py-0.5">
                            {step}
                          </span>
                          {i < content.recommendedFlow.length - 1 && (
                            <span className="text-muted-foreground text-[10px] mx-0.5">→</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                {content.sections.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground mb-1.5 tracking-wide">
                      Passo a passo
                    </p>
                    <ol className="space-y-2">
                      {content.sections.map((section, i) => (
                        <li
                          key={i}
                          className="border-l-2 border-[#C98A75]/40 pl-2.5 py-1 text-xs leading-relaxed text-foreground/80"
                        >
                          <strong className="text-[#2A1F1A] block mb-0.5">{section.title}</strong>
                          <span className="text-[11px] leading-relaxed text-foreground/65">
                            {section.text}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}

            {activeTab === "Campos" && (
              <div className="space-y-3">
                {content.sections.map((section, i) => (
                  <div key={i}>
                    <h4 className="font-medium text-[#2A1F1A] text-xs mb-0.5">
                      {section.title}
                    </h4>
                    <p className="text-[11px] leading-relaxed text-foreground/65">
                      {section.text}
                    </p>
                    {i < content.sections.length - 1 && (
                      <div className="mt-2.5 border-t border-[#3D2F28]/8" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Dica da Ká */}
            {content.kaTip && (
              <div className="bg-gradient-to-br from-[#C98A75]/12 to-[#C98A75]/6 border border-[#C98A75]/40 rounded-lg p-3 mt-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-[22px] h-[22px] rounded-full bg-[#C98A75] flex items-center justify-center text-[10px] font-bold text-[#2A1F1A]">
                    Ká
                  </div>
                  <span className="text-[11px] text-[#8a6a1a] font-medium">
                    Dica da Ká
                  </span>
                </div>
                <p className="text-[11px] italic text-[#6b5216] leading-relaxed">
                  {content.kaTip}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
