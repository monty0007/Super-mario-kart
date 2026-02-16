import { CONTROLS } from "../constants";
import { InputAction, KeyMapping } from "../types";

export class InputManager {
  private activeKeys: Set<string> = new Set();
  private virtualActions: Set<InputAction> = new Set();
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

  // Allow setting actions programmatically (for touch controls)
  public setVirtualAction(action: InputAction, active: boolean) {
    if (active) {
      this.virtualActions.add(action);
    } else {
      this.virtualActions.delete(action);
    }
  }

  public isActionActive(action: InputAction): boolean {
    const keys = this.mapping[action];
    // Check both physical keys and virtual touch buttons
    return keys.some(key => this.activeKeys.has(key)) || this.virtualActions.has(action);
  }

  public remap(action: InputAction, newKey: string) {
    if (!newKey || typeof newKey !== 'string') return;
    this.mapping[action] = [newKey];
  }
}
