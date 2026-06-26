export const VISUAL_EVENT_NAME = "ancient-defense:visual-event";
export function dispatchVisualEvent(detail) {
    window.dispatchEvent(new CustomEvent(VISUAL_EVENT_NAME, { detail }));
}
//# sourceMappingURL=visual-event-bridge.js.map