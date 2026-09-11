import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type RefObject } from "react";

import {
  OneUIButton,
  OneUICard,
  OneUISearchField,
  OneUISegmentedControl,
  OneUISelectionMenu,
  OneUISelectionMenuItem,
  OneUIStateMessage,
} from "./one-ui";
import { OneUIInteractionPage } from "./one-ui/interaction-page";
import { buildSearchIndex, searchCategories, searchIndex, type SearchCategory, type SearchEntry, type SearchTarget } from "./search";
import type { CollectorState } from "./store";
import searchGlyphUrl from "./assets/one-ui/figma/search.svg";
import appsGlyphUrl from "./assets/one-ui/figma/apps-outline.svg";
import deviceGlyphUrl from "./assets/one-ui/figma/device-outline.svg";
import equalizerGlyphUrl from "./assets/one-ui/figma/equalizer.svg";
import folderGlyphUrl from "./assets/one-ui/figma/folder-outline.svg";
import labsGlyphUrl from "./assets/one-ui/figma/labs-outline.svg";
import settingsGlyphUrl from "./assets/one-ui/figma/settings-outline.svg";
import contactGlyphUrl from "./assets/one-ui/figma/contact-outline.svg";
import "./search.css";

export type { SearchTarget } from "./search";

type SearchMode = "workspace" | "actions";
const resultLimit = 40;
const recentSearchesKey = "smartglove-search-recents";
const recentLimit = 8;

const categoryIcons: Partial<Record<SearchCategory, string>> = {
  places: appsGlyphUrl,
  devices: deviceGlyphUrl,
  channels: equalizerGlyphUrl,
  actions: settingsGlyphUrl,
  datasets: folderGlyphUrl,
  gestures: appsGlyphUrl,
  runs: labsGlyphUrl,
  models: labsGlyphUrl,
};

function loadRecents(): string[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(recentSearchesKey) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === "string" && value.trim().length > 0).slice(0, recentLimit);
  } catch {
    return [];
  }
}

function saveRecents(values: string[]) {
  try { window.localStorage.setItem(recentSearchesKey, JSON.stringify(values.slice(0, recentLimit))); } catch { /* local search history is optional */ }
}

export function GlobalSearch({
  open,
  onDismiss,
  returnFocusRef,
  state,
  canManageUsers,
  onSelect,
}: {
  open: boolean;
  onDismiss: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  state: CollectorState;
  canManageUsers: boolean;
  onSelect: (target: SearchTarget) => void;
}) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("workspace");
  const [category, setCategory] = useState<SearchCategory | "all">("all");
  const [recents, setRecents] = useState<string[]>(loadRecents);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const pendingTargetRef = useRef<SearchTarget | null>(null);
  const id = useId();
  const entries = useMemo(() => buildSearchIndex({ devices: state.devices, channels: state.channels }, canManageUsers), [state.devices, state.channels, canManageUsers]);

  const modeEntries = useMemo(() => entries.filter((entry) => mode === "actions" ? entry.category === "actions" : entry.category !== "actions"), [entries, mode]);
  const effectiveCategory: SearchCategory | "all" = mode === "actions" ? "actions" : category === "actions" ? "all" : category;
  const matches = useMemo(() => searchIndex(modeEntries, query, effectiveCategory), [modeEntries, query, effectiveCategory]);
  const results = matches.slice(0, resultLimit);
  const categoryHasContent = modeEntries.some((entry) => effectiveCategory === "all" || entry.category === effectiveCategory);
  const selectedCategory = effectiveCategory === "all" ? undefined : searchCategories.find((item) => item.id === effectiveCategory);
  const browsing = query.trim().length === 0;

  const suggested = useMemo(() => {
    const wanted = ["place-devices", "place-monitor", "place-studio", canManageUsers ? "place-users" : "place-channels"];
    return wanted.flatMap((id) => {
      const entry = entries.find((item) => item.id === id);
      return entry ? [entry] : [];
    });
  }, [entries, canManageUsers]);

  const categoryTiles = useMemo(() => searchCategories.filter((item) => mode === "actions" ? item.id === "actions" : item.id !== "actions"), [mode]);

  useEffect(() => {
    if (!open) return;
    pendingTargetRef.current = null;
    setQuery("");
    setMode("workspace");
    setCategory("all");
    setRecents(loadRecents());
  }, [open]);

  function remember(value: string) {
    const normalized = value.trim();
    if (!normalized) return;
    setRecents((current) => {
      const next = [normalized, ...current.filter((item) => item.toLocaleLowerCase() !== normalized.toLocaleLowerCase())].slice(0, recentLimit);
      saveRecents(next);
      return next;
    });
  }

  function select(entry: SearchEntry) {
    if (!open) return;
    remember(query || entry.title);
    pendingTargetRef.current = entry.target;
    onDismiss();
  }

  function finishClose() {
    const target = pendingTargetRef.current;
    pendingTargetRef.current = null;
    if (target) onSelect(target);
  }

  function setSearchMode(next: SearchMode) {
    setMode(next);
    setCategory(next === "actions" ? "actions" : "all");
  }

  function chooseCategory(next: SearchCategory) {
    setMode(next === "actions" ? "actions" : "workspace");
    setCategory(next);
    requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
  }

  function inputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (results.length === 0) return;
      event.preventDefault();
      resultRefs.current[event.key === "ArrowDown" ? 0 : results.length - 1]?.focus();
    } else if (event.key === "Enter" && query.trim() && results[0]) {
      event.preventDefault();
      remember(query);
      select(results[0]);
    }
  }

  function resultKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      resultRefs.current[Math.min(index + 1, results.length - 1)]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (index === 0) inputRef.current?.focus();
      else resultRefs.current[index - 1]?.focus();
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      resultRefs.current[event.key === "Home" ? 0 : results.length - 1]?.focus();
    }
  }

  function removeRecent(value: string) {
    setRecents((current) => {
      const next = current.filter((item) => item !== value);
      saveRecents(next);
      return next;
    });
  }

  function clearRecents() {
    setRecents([]);
    saveRecents([]);
  }

  return (
    <OneUIInteractionPage
      className="global-search-page"
      id="global-search"
      title="Search"
      presentation="search"
      open={open}
      onDismiss={onDismiss}
      onAfterClose={finishClose}
      returnFocusRef={returnFocusRef}
    >
      <div className="global-search">
        <section className="global-search__hero" aria-label="Search workspace">
          <h2>Search</h2>
        </section>

        <div className="global-search__tabs-shell">
          <OneUISegmentedControl<SearchMode>
            className="global-search__tabs"
            ariaLabel="Search mode"
            value={mode}
            onChange={setSearchMode}
            options={[
              { value: "workspace", label: "Workspace" },
              { value: "actions", label: "Actions" },
            ]}
          />
        </div>

        {browsing ? (
          <div className="global-search__browse">
            {recents.length > 0 ? (
              <OneUICard
                className="global-search__card global-search__recent-card"
                title="Recent searches"
                accessory={<OneUIButton className="global-search__clear-all" variant="quiet" onClick={clearRecents}>Clear all</OneUIButton>}
              >
                <div className="global-search__recent-list">
                  {recents.map((recent) => (
                    <span className="global-search__recent-chip" key={recent}>
                      <button type="button" className="global-search__recent-term" onClick={() => { setQuery(recent); inputRef.current?.focus({ preventScroll: true }); }}>{recent}</button>
                      <button type="button" className="global-search__recent-remove" aria-label={`Remove ${recent} from recent searches`} onClick={() => removeRecent(recent)}>×</button>
                    </span>
                  ))}
                </div>
              </OneUICard>
            ) : null}

            {mode === "workspace" ? (
              <OneUICard className="global-search__card" title="Explore your workspace" description="Jump straight to the places you use most.">
                <div className="global-search__featured-grid">
                  {suggested.map((entry) => (
                    <button className="global-search__featured-item" key={entry.id} type="button" onClick={() => select(entry)}>
                      <span className="global-search__featured-icon" aria-hidden="true">
                        <img src={entry.target.kind === "navigate" && entry.target.page === "devices" ? deviceGlyphUrl : entry.target.kind === "navigate" && entry.target.page === "live" ? equalizerGlyphUrl : entry.target.kind === "navigate" && entry.target.page === "studio" ? appsGlyphUrl : contactGlyphUrl} alt="" />
                      </span>
                      <strong>{entry.title}</strong>
                      <span>{entry.description}</span>
                    </button>
                  ))}
                </div>
              </OneUICard>
            ) : (
              <OneUICard className="global-search__card" title="Quick actions" description="Common app controls are available here.">
                <div className="global-search__featured-grid global-search__featured-grid--actions">
                  {matches.map((entry) => (
                    <button className="global-search__featured-item" key={entry.id} type="button" onClick={() => select(entry)}>
                      <span className="global-search__featured-icon" aria-hidden="true"><img src={settingsGlyphUrl} alt="" /></span>
                      <strong>{entry.title}</strong>
                      <span>{entry.description}</span>
                    </button>
                  ))}
                </div>
              </OneUICard>
            )}

            <OneUICard className="global-search__card global-search__categories-card" title="Categories">
              <div className="global-search__category-grid">
                {categoryTiles.map((item) => (
                  <button className="global-search__category-tile" key={item.id} type="button" onClick={() => chooseCategory(item.id)}>
                    <span className="global-search__category-icon" aria-hidden="true"><img src={categoryIcons[item.id] ?? appsGlyphUrl} alt="" /></span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </OneUICard>
          </div>
        ) : (
          <div className="global-search__results" id={`${id}-results`}>
            <p className="global-search__summary" role="status" aria-live="polite" aria-atomic="true">
              {matches.length > 0 ? `${matches.length} ${matches.length === 1 ? "result" : "results"} for “${query.trim()}”` : "No search results"}
            </p>
            {results.length > 0 ? (
              <OneUISelectionMenu className="global-search__list" aria-label="Search results">
                {results.map((entry, index) => (
                  <li key={entry.id}>
                    <OneUISelectionMenuItem
                      ref={(element) => { resultRefs.current[index] = element; }}
                      title={entry.title}
                      description={entry.description}
                      meta={searchCategories.find((item) => item.id === entry.category)?.label}
                      onClick={() => select(entry)}
                      onKeyDown={(event) => resultKeyDown(event, index)}
                    />
                  </li>
                ))}
              </OneUISelectionMenu>
            ) : (
              <OneUIStateMessage
                title={!categoryHasContent ? `No ${selectedCategory?.label.toLowerCase() ?? "items"} yet` : "No matches found"}
                description={!categoryHasContent ? selectedCategory?.emptyDescription : "Try another device, channel, Studio section, or action."}
              />
            )}
            {matches.length > resultLimit ? <p className="global-search__hint">Showing the first {resultLimit} results. Refine your search to find more.</p> : null}
          </div>
        )}

        <div className="global-search__floating-search" role="search" aria-label="Search workspace">
          <OneUISearchField
            ref={inputRef}
            className="global-search__input"
            icon={<img className="one-ui-figma-glyph" src={searchGlyphUrl} alt="" />}
            label="Search workspace"
            placeholder="Search"
            value={query}
            maxLength={200}
            autoComplete="off"
            spellCheck={false}
            aria-controls={`${id}-results`}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={inputKeyDown}
          />
        </div>
      </div>
    </OneUIInteractionPage>
  );
}
