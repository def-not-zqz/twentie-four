export const DEV_MODE = true;

export function debug(...args) {
  if (DEV_MODE) {
    console.debug("[debug]", ...args);
  }
}