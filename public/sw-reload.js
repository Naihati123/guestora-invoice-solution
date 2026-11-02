/* Free GST Billing - imported into the service worker (vite.config.js,
   workbox.importScripts). v1.10.83.

   When a NEW version of the app takes over, reload every open window of the
   app. A window still showing the previous version can be stuck on a blank
   screen (its code asked for files the update removed), and nothing in that
   window can fix itself because its own code never ran. This runs in the new
   version, so it also rescues windows of versions from before this fix.
   The very first install (no previous version) reloads nothing. */
var fgsbIsUpdate = false;
self.addEventListener('install', function () {
  fgsbIsUpdate = !!self.registration.active;
});
// A window that is still loading refuses navigate(): try again a few times.
function fgsbReload(win, triesLeft) {
  return win.navigate(win.url).catch(function () {
    if (triesLeft <= 0) return null;
    return new Promise(function (res) { setTimeout(res, 1000); }).then(function () { return fgsbReload(win, triesLeft - 1); });
  });
}
self.addEventListener('activate', function (event) {
  if (!fgsbIsUpdate) return;
  event.waitUntil(
    self.clients.claim()
      .then(function () { return self.clients.matchAll({ type: 'window' }); })
      .then(function (wins) {
        return Promise.all(wins.map(function (w) { return fgsbReload(w, 5); }));
      })
  );
});
