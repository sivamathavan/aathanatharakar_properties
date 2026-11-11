// Opens the help panel from anywhere (More → Help, error panels), without
// passing state through layouts. The mounted <HelpWidget> listens.
export const OPEN_HELP_EVENT = "proppage:open-help";

export type HelpView = "chat" | "contact";

export function openHelp(view: HelpView = "chat") {
  window.dispatchEvent(new CustomEvent<HelpView>(OPEN_HELP_EVENT, { detail: view }));
}
