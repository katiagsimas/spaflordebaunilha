import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useGroup } from "@/contexts/GroupContext";
import { toast } from "sonner";
import {
  AREAS,
  ALL_BLOCKS,
  PHRASES,
  COMPLETION_MSGS,
  EXTRAS_ITEMS,
  blockItems,
  getWeekKey,
  type RitualState,
  type Area,
} from "./data";
import { generateRitualPDF } from "./pdf";
import "./organizacao-doce.css";

const EMPTY_STATE: RitualState = {
  startDate: null,
  weekKey: null,
  done: {},
  closed: {},
  custom: {},
  extras: {},
};

export default function OrganizacaoDoce() {
  const { user } = useAuth();
  const { activeGroup } = useGroup();

  const [state, setState] = useState<RitualState>(EMPTY_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [tempDate, setTempDate] = useState("");
  const [editing, setEditing] = useState(false);
  const [newItem, setNewItem] = useState<Record<string, string>>({});
  const [editIdx, setEditIdx] = useState<{ blockId: string; idx: number } | null>(null);
  const [editText, setEditText] = useState("");
  const [resetDialog, setResetDialog] = useState(false);
  const [activeArea, setActiveArea] = useState<Area["id"]>("diaria");
  const [pdfDialog, setPdfDialog] = useState(false);
  const [pdfAreas, setPdfAreas] = useState<Set<string>>(() => new Set(AREAS.map((a) => a.id)));
  const [pdfBlocks, setPdfBlocks] = useState<Set<string>>(() => new Set(ALL_BLOCKS.map((b) => b.id)));
  const [pdfFilter, setPdfFilter] = useState<"all" | "done" | "pending">("all");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate state from DB
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("organizacao_doce_state")
        .select("data")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) console.error("Erro carregando Organização Doce:", error);
      if (data?.data) {
        const parsed = data.data as Partial<RitualState>;
        const next: RitualState = {
          startDate: parsed.startDate ?? null,
          weekKey: parsed.weekKey ?? null,
          done: parsed.done ?? {},
          closed: parsed.closed ?? {},
          custom: parsed.custom ?? {},
          extras: parsed.extras ?? {},
        };
        if (next.startDate) {
          const currentWeek = getWeekKey(next.startDate);
          if (next.weekKey !== currentWeek) {
            next.done = {};
            next.weekKey = currentWeek;
          }
        }
        setState(next);
      }
      setHydrated(true);
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Persist state with debounce
  useEffect(() => {
    if (!hydrated || !user) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      supabase
        .from("organizacao_doce_state")
        .upsert(
          {
            user_id: user.id,
            owner_group_id: activeGroup?.id ?? null,
            data: JSON.parse(JSON.stringify(state)),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        )
        .then(({ error }) => {
          if (error) console.error("Erro salvando Organização Doce:", error);
        });
    }, 600);
  }, [state, hydrated, user, activeGroup?.id]);

  const areaStats = useMemo(() => {
    const stats = {} as Record<Area["id"], { done: number; total: number }>;
    AREAS.forEach((a) => {
      let total = 0, done = 0;
      a.blocks.forEach((b) => {
        const items = blockItems(b, state.custom);
        total += items.length;
        items.forEach((_, i) => { if (state.done[`${b.id}-${i}`]) done++; });
      });
      stats[a.id] = { done, total };
    });
    return stats;
  }, [state.custom, state.done]);

  const currentArea = AREAS.find((a) => a.id === activeArea)!;

  const total = useMemo(
    () => ALL_BLOCKS.reduce((s, b) => s + blockItems(b, state.custom).length, 0),
    [state.custom]
  );
  const completedCount = useMemo(
    () => Object.values(state.done).filter(Boolean).length,
    [state.done]
  );
  const progress = total ? (completedCount / total) * 100 : 0;

  const phrase = useMemo(() => {
    if (!state.startDate) return PHRASES[0];
    const weekNum = parseInt(state.weekKey?.split("-w")[1] ?? "0", 10);
    return PHRASES[weekNum % PHRASES.length];
  }, [state.startDate, state.weekKey]);

  const weekLabel = useMemo(() => {
    if (!state.startDate) return "";
    const weekNum = parseInt(state.weekKey?.split("-w")[1] ?? "0", 10) + 1;
    return `Semana ${weekNum}`;
  }, [state.startDate, state.weekKey]);

  const weekRange = useMemo(() => {
    if (!state.startDate) return "";
    const weekNum = parseInt(state.weekKey?.split("-w")[1] ?? "0", 10);
    const start = new Date(state.startDate + "T00:00:00");
    start.setDate(start.getDate() + weekNum * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const fmt = (d: Date) =>
      `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    return `${fmt(start)} à ${fmt(end)}`;
  }, [state.startDate, state.weekKey]);

  function confirmDate() {
    if (!tempDate) return;
    setState((s) => ({
      ...s, startDate: tempDate, weekKey: getWeekKey(tempDate), done: {},
    }));
    setEditing(false);
    setTempDate("");
  }

  function toggleItem(blockId: string, idx: number) {
    const key = `${blockId}-${idx}`;
    setState((s) => ({ ...s, done: { ...s.done, [key]: !s.done[key] } }));
  }

  function toggleBlock(id: string) {
    setState((s) => ({ ...s, closed: { ...s.closed, [id]: !s.closed[id] } }));
  }

  function performReset(clearCustom: boolean) {
    setState((s) => ({
      ...s,
      done: {},
      custom: clearCustom ? {} : s.custom,
      weekKey: s.startDate ? getWeekKey(s.startDate) : s.weekKey,
    }));
    setResetDialog(false);
    toast.success("Nova semana iniciada.");
  }

  function addCustomItem(blockId: string) {
    const text = (newItem[blockId] ?? "").trim();
    if (!text) return;
    setState((s) => ({
      ...s,
      custom: { ...s.custom, [blockId]: [...(s.custom[blockId] ?? []), text] },
    }));
    setNewItem((n) => ({ ...n, [blockId]: "" }));
  }

  function updateCustom(
    blockId: string,
    transform: (list: string[]) => { list: string[]; map: number[] }
  ) {
    setState((s) => {
      const block = ALL_BLOCKS.find((b) => b.id === blockId)!;
      const baseLen = block.items.length;
      const oldList = s.custom[blockId] ?? [];
      const { list, map } = transform(oldList);
      const newDone: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(s.done)) {
        const m = k.match(/^(.+)-(\d+)$/);
        if (!m || m[1] !== blockId) { newDone[k] = v; continue; }
        const i = parseInt(m[2], 10);
        if (i < baseLen) newDone[k] = v;
      }
      map.forEach((oldCustomIdx, newCustomIdx) => {
        if (oldCustomIdx < 0) return;
        const oldKey = `${blockId}-${baseLen + oldCustomIdx}`;
        if (s.done[oldKey]) {
          newDone[`${blockId}-${baseLen + newCustomIdx}`] = true;
        }
      });
      return { ...s, custom: { ...s.custom, [blockId]: list }, done: newDone };
    });
  }

  function removeCustomItem(blockId: string, customIdx: number) {
    updateCustom(blockId, (list) => {
      const out: string[] = [];
      const map: number[] = [];
      list.forEach((t, i) => {
        if (i === customIdx) return;
        out.push(t); map.push(i);
      });
      return { list: out, map };
    });
  }

  function moveCustomItem(blockId: string, customIdx: number, dir: -1 | 1) {
    updateCustom(blockId, (list) => {
      const target = customIdx + dir;
      if (target < 0 || target >= list.length) return { list, map: list.map((_, i) => i) };
      const out = [...list];
      [out[customIdx], out[target]] = [out[target], out[customIdx]];
      const map = list.map((_, i) => i);
      [map[customIdx], map[target]] = [map[target], map[customIdx]];
      return { list: out, map };
    });
  }

  function saveEdit() {
    if (!editIdx) return;
    const text = editText.trim();
    const { blockId, idx } = editIdx;
    const block = ALL_BLOCKS.find((b) => b.id === blockId)!;
    const customIdx = idx - block.items.length;
    if (text && customIdx >= 0) {
      setState((s) => {
        const list = [...(s.custom[blockId] ?? [])];
        list[customIdx] = text;
        return { ...s, custom: { ...s.custom, [blockId]: list } };
      });
    }
    setEditIdx(null);
    setEditText("");
  }

  function downloadPDF() {
    const ok = generateRitualPDF(state, pdfBlocks, pdfFilter, phrase, weekLabel, weekRange);
    if (!ok) {
      toast.info("Nenhuma tarefa corresponde aos filtros selecionados.");
      return;
    }
    setPdfDialog(false);
    toast.success("PDF gerado.");
  }

  if (!hydrated) return <div className="od-body" />;

  const showSetup = !state.startDate || editing;

  return (
    <div className="od-body">
      <header className="od-header">
        <div className="od-eyebrow">✦ Ritual da Empresária</div>
        <h1 className="od-title">
          Organização Doce
          <em>Rotinas Inteligentes para Confeiteiras</em>
        </h1>
        <div className="od-divider" />
        {state.startDate && !editing && (
          <>
            <div className="od-week">{weekLabel}</div>
            <div className="od-week-range">{weekRange}</div>
          </>
        )}
      </header>

      <div className="od-container">
        {showSetup ? (
          <div className="od-setup-wrap">
            <div className="od-setup-card">
              <div className="od-setup-icon">✦</div>
              <h2 className="od-setup-title">Quando começa sua semana?</h2>
              <p className="od-setup-sub">
                Escolha o primeiro dia para começar a acompanhar sua rotina.
                As semanas serão contadas a partir desta data.
              </p>
              <input
                type="date"
                className="od-date-input"
                value={tempDate || state.startDate || ""}
                onChange={(e) => setTempDate(e.target.value)}
              />
              <button
                className="od-confirm-btn"
                onClick={confirmDate}
                disabled={!tempDate && !state.startDate}
              >
                Confirmar
              </button>
              {editing && state.startDate && (
                <button className="od-change-date" onClick={() => { setEditing(false); setTempDate(""); }}>
                  Cancelar
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="od-phrase-wrap">
              <div className="od-phrase-card">
                <div className="od-phrase-eyebrow">✦ Frase Ká Simas</div>
                <p className="od-phrase-text">"{phrase.text}"</p>
                <div className="od-phrase-author">— {phrase.author}</div>
              </div>
            </div>

            <div className="od-tabs-wrap">
              <div className="od-tabs" role="tablist">
                {AREAS.map((a) => {
                  const st = areaStats[a.id];
                  const pct = st.total ? Math.round((st.done / st.total) * 100) : 0;
                  return (
                    <button
                      key={a.id}
                      role="tab"
                      aria-selected={activeArea === a.id}
                      className={`od-tab ${activeArea === a.id ? "active" : ""}`}
                      onClick={() => setActiveArea(a.id)}
                    >
                      <span className="od-tab-label">{a.label}</span>
                      <span className="od-tab-pct">{pct}%</span>
                    </button>
                  );
                })}
              </div>
              <div className="od-tab-tagline">{currentArea.tagline}</div>
            </div>

            <div className="od-progress-wrap">
              <div className="od-progress-card">
                <div className="od-progress-top">
                  <span className="od-progress-label">Progresso · {currentArea.label}</span>
                  <span className="od-progress-val">
                    {areaStats[activeArea].done} de {areaStats[activeArea].total}
                  </span>
                </div>
                <div className="od-bar-bg">
                  <div
                    className="od-bar-fill"
                    style={{
                      width: `${areaStats[activeArea].total ? (areaStats[activeArea].done / areaStats[activeArea].total) * 100 : 0}%`,
                    }}
                  />
                </div>
                <div className="od-progress-global">
                  <span>Operação geral</span>
                  <span>{completedCount} de {total}</span>
                </div>
                <div className="od-bar-bg od-bar-bg-thin">
                  <div className="od-bar-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>

            {areaStats[activeArea].total > 0 &&
              areaStats[activeArea].done === areaStats[activeArea].total && (
                <div className="od-completion">
                  <div className="od-completion-star">✦</div>
                  <div className="od-completion-title">{currentArea.label} concluído.</div>
                  <div className="od-completion-msg">
                    {COMPLETION_MSGS[activeArea][
                      Math.floor(Date.now() / 86400000) % COMPLETION_MSGS[activeArea].length
                    ]}
                  </div>
                </div>
              )}

            <div className="od-blocks">
              {currentArea.blocks.map((block) => {
                const closed = !!state.closed[block.id];
                const customList = state.custom[block.id] ?? [];
                const all = blockItems(block, state.custom);
                const blockDone = all.filter((_, i) => state.done[`${block.id}-${i}`]).length;
                return (
                  <div key={block.id} className={`od-block ${closed ? "closed" : ""}`}>
                    <div className="od-block-head" onClick={() => toggleBlock(block.id)}>
                      <div className="od-block-icon">{block.icon}</div>
                      <h3 className="od-block-title">{block.title}</h3>
                      <div className="od-block-meta">
                        <span className="od-block-cnt">{blockDone}/{all.length}</span>
                        <svg className="od-chevron" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
                      </div>
                    </div>
                    <div className="od-block-body">
                      {all.map((label, i) => {
                        const key = `${block.id}-${i}`;
                        const done = !!state.done[key];
                        const isCustom = i >= block.items.length;
                        const customIdx = i - block.items.length;
                        const isEditing = editIdx?.blockId === block.id && editIdx?.idx === i;
                        const extrasKey = `${block.id}:${label}`;
                        const extrasCfg = EXTRAS_ITEMS[extrasKey];
                        const extras = state.extras[extrasKey] ?? {};
                        return (
                          <div key={key} className="od-item-wrap">
                            <div className={`od-item ${done ? "done" : ""}`}>
                              <div className="od-cb-wrap" onClick={() => !isEditing && toggleItem(block.id, i)}>
                                <div className="od-cb">
                                  <svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7" /></svg>
                                </div>
                              </div>
                              {isEditing ? (
                                <input
                                  className="od-edit-input"
                                  autoFocus
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  onBlur={saveEdit}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveEdit();
                                    if (e.key === "Escape") { setEditIdx(null); setEditText(""); }
                                  }}
                                />
                              ) : (
                                <span className="od-item-label" onClick={() => toggleItem(block.id, i)}>
                                  {label}
                                </span>
                              )}
                              {isCustom && !isEditing && (
                                <div className="od-item-actions">
                                  <button
                                    className="od-ia-btn"
                                    onClick={(e) => { e.stopPropagation(); moveCustomItem(block.id, customIdx, -1); }}
                                    disabled={customIdx === 0}
                                    aria-label="Mover para cima"
                                  >↑</button>
                                  <button
                                    className="od-ia-btn"
                                    onClick={(e) => { e.stopPropagation(); moveCustomItem(block.id, customIdx, 1); }}
                                    disabled={customIdx === customList.length - 1}
                                    aria-label="Mover para baixo"
                                  >↓</button>
                                  <button
                                    className="od-ia-btn"
                                    onClick={(e) => { e.stopPropagation(); setEditIdx({ blockId: block.id, idx: i }); setEditText(label); }}
                                    aria-label="Editar"
                                  >✎</button>
                                  <button
                                    className="od-ia-btn od-ia-remove"
                                    onClick={(e) => { e.stopPropagation(); removeCustomItem(block.id, customIdx); }}
                                    aria-label="Remover"
                                  >×</button>
                                </div>
                              )}
                            </div>
                            {extrasCfg && (
                              <div className="od-item-extras">
                                <label className="od-item-extras-label">{extrasCfg.amountLabel}</label>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  className="od-item-extras-input"
                                  placeholder="Ex.: 2.500,00"
                                  value={extras.amount ?? ""}
                                  onChange={(e) =>
                                    setState((s) => ({
                                      ...s,
                                      extras: { ...s.extras, [extrasKey]: { ...s.extras[extrasKey], amount: e.target.value } },
                                    }))
                                  }
                                />
                                <label className="od-item-extras-label">{extrasCfg.notesLabel}</label>
                                <textarea
                                  rows={2}
                                  className="od-item-extras-input od-item-extras-textarea"
                                  placeholder="Anote critérios, periodicidade, justificativa..."
                                  value={extras.notes ?? ""}
                                  onChange={(e) =>
                                    setState((s) => ({
                                      ...s,
                                      extras: { ...s.extras, [extrasKey]: { ...s.extras[extrasKey], notes: e.target.value } },
                                    }))
                                  }
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <div className="od-add-row">
                        <input
                          type="text"
                          className="od-add-input"
                          placeholder="+ Nova tarefa"
                          value={newItem[block.id] ?? ""}
                          onChange={(e) => setNewItem((n) => ({ ...n, [block.id]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === "Enter") addCustomItem(block.id); }}
                        />
                        <button className="od-add-btn" onClick={() => addCustomItem(block.id)}>
                          Adicionar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="od-bottom">
              <button className="od-reset-btn" onClick={() => setPdfDialog(true)}>
                <svg viewBox="0 0 24 24"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" /></svg>
                Baixar PDF
              </button>
              <button className="od-reset-btn" onClick={() => setResetDialog(true)}>
                <svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" /></svg>
                Iniciar nova semana
              </button>
              <button className="od-change-date" onClick={() => { setTempDate(state.startDate || ""); setEditing(true); }}>
                Alterar data de início
              </button>
            </div>
          </>
        )}
      </div>

      {resetDialog && (
        <div className="od-modal-overlay" onClick={() => setResetDialog(false)}>
          <div className="od-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="od-setup-icon">✦</div>
            <h3 className="od-setup-title">Iniciar nova semana</h3>
            <p className="od-setup-sub">
              Suas marcações serão reiniciadas. O que deseja fazer com as tarefas que você adicionou?
            </p>
            <button className="od-confirm-btn" onClick={() => performReset(false)}>
              Manter minhas tarefas
            </button>
            <button className="od-confirm-btn od-confirm-secondary" onClick={() => performReset(true)}>
              Limpar minhas tarefas
            </button>
            <button className="od-change-date" onClick={() => setResetDialog(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {pdfDialog && (
        <div className="od-modal-overlay" onClick={() => setPdfDialog(false)}>
          <div className="od-modal-card od-pdf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="od-setup-icon">✦</div>
            <h3 className="od-setup-title">Exportar PDF</h3>
            <p className="od-setup-sub">Escolha exatamente o que incluir no seu planner.</p>

            <div className="od-pdf-section">
              <div className="od-pdf-section-head">
                <label className="od-pdf-label">1 · Escopo / Áreas</label>
                <button
                  type="button"
                  className="od-pdf-mini"
                  onClick={() => {
                    const allOn = pdfAreas.size === AREAS.length;
                    const nextAreas = new Set(allOn ? [] : AREAS.map((a) => a.id));
                    setPdfAreas(nextAreas);
                    setPdfBlocks(
                      new Set(
                        ALL_BLOCKS.filter((b) =>
                          nextAreas.has(AREAS.find((a) => a.blocks.includes(b))!.id)
                        ).map((b) => b.id)
                      )
                    );
                  }}
                >
                  {pdfAreas.size === AREAS.length ? "Limpar" : "Selecionar tudo"}
                </button>
              </div>
              <div className="od-pdf-chips">
                {AREAS.map((a) => {
                  const on = pdfAreas.has(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      className={`od-pdf-chip ${on ? "on" : ""}`}
                      onClick={() => {
                        const nextAreas = new Set(pdfAreas);
                        const nextBlocks = new Set(pdfBlocks);
                        if (on) {
                          nextAreas.delete(a.id);
                          a.blocks.forEach((b) => nextBlocks.delete(b.id));
                        } else {
                          nextAreas.add(a.id);
                          a.blocks.forEach((b) => nextBlocks.add(b.id));
                        }
                        setPdfAreas(nextAreas);
                        setPdfBlocks(nextBlocks);
                      }}
                    >
                      {a.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="od-pdf-section">
              <div className="od-pdf-section-head">
                <label className="od-pdf-label">2 · Blocos</label>
                <button
                  type="button"
                  className="od-pdf-mini"
                  onClick={() => {
                    const visibleBlocks = AREAS
                      .filter((a) => pdfAreas.has(a.id))
                      .flatMap((a) => a.blocks.map((b) => b.id));
                    const allOn = visibleBlocks.every((id) => pdfBlocks.has(id));
                    const next = new Set(pdfBlocks);
                    visibleBlocks.forEach((id) => { if (allOn) next.delete(id); else next.add(id); });
                    setPdfBlocks(next);
                  }}
                >
                  Alternar
                </button>
              </div>
              <div className="od-pdf-block-list">
                {AREAS.filter((a) => pdfAreas.has(a.id)).map((a) => (
                  <div key={a.id}>
                    <div className="od-pdf-block-group-title">{a.label}</div>
                    <div className="od-pdf-chips">
                      {a.blocks.map((b) => {
                        const on = pdfBlocks.has(b.id);
                        return (
                          <button
                            key={b.id}
                            type="button"
                            className={`od-pdf-chip ${on ? "on" : ""}`}
                            onClick={() => {
                              const next = new Set(pdfBlocks);
                              if (on) next.delete(b.id); else next.add(b.id);
                              setPdfBlocks(next);
                            }}
                          >
                            {b.title}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {pdfAreas.size === 0 && (
                  <div className="od-pdf-empty">Selecione ao menos uma área para escolher blocos.</div>
                )}
              </div>
            </div>

            <div className="od-pdf-section">
              <label className="od-pdf-label">3 · Tipos de Tarefas</label>
              <div className="od-pdf-chips">
                {([
                  { v: "all", l: "Todas" },
                  { v: "done", l: "Somente concluídas" },
                  { v: "pending", l: "Somente pendentes" },
                ] as const).map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    className={`od-pdf-chip ${pdfFilter === opt.v ? "on" : ""}`}
                    onClick={() => setPdfFilter(opt.v)}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="od-confirm-btn"
              disabled={pdfBlocks.size === 0}
              onClick={downloadPDF}
              style={{ marginTop: 16 }}
            >
              Gerar PDF
            </button>
            <button className="od-change-date" onClick={() => setPdfDialog(false)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
