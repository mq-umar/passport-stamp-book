/* Deployment switch. false = talk to the mock backend when served over http (sign in with demo / demo).
 * A static host with no backend (for example GitHub Pages) overwrites this file with true, which
 * skips sign-in and uses the built-in data. */
window.PASSPORT_STATIC = false;
