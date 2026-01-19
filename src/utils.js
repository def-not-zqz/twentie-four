import { DEV_MODE } from "./constants";

export function debug(...args) {
  if (DEV_MODE) {
    console.debug("[debug]", ...args);
  }
}