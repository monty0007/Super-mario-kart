import { CONTROLS } from "../constants";
import { InputAction, KeyMapping } from "../types";

export class InputManager {
  private activeKeys: Set<string> = new Set();
  private mapping: KeyMapping;

  constructor(customMapping?: Partial<KeyMapping>) {
    this.mapping = { ...CONTROLS.DEFAULT_MAPPING, ...customMapping };
    this.bindEvents();
  }

  private bindEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  public cleanup() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  // Sanitize input: We only care about keys, no complex data injection possible here.
  private handleKeyDown = (e: KeyboardEvent) => {
    // Prevent default scrolling for game keys
    if (this.isGameKey(e.code)) {
      e.preventDefault();
    }
    this.activeKeys.add(e.code);
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.activeKeys.delete(e.code);
  };

  private isGameKey(code: string): boolean {
    return Object.values(this.mapping).some(keys => keys.includes(code));
  }

  public isActionActive(action: InputAction): boolean {
    const keys = this.mapping[action];
    return keys.some(key => this.activeKeys.has(key));
  }

  public remap(action: InputAction, newKey: string) {
    // Basic validation
    if (!newKey || typeof newKey !== 'string') return;
    this.mapping[action] = [newKey];
  }
}
