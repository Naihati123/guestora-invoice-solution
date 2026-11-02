#!/bin/sh
# Checks uninstall-unix.sh (Control Panel -> Remove the app) in a throwaway
# Linux container with a fake home: what is kept, what goes, the last copy,
# and that a failed copy keeps the data. Run: npm run test:uninstall-unix
set -u
fail=0; check() { if eval "$2"; then echo "PASS $1"; else echo "FAIL $1"; fail=1; fi; }
setup() {
  rm -rf /h; export HOME=/h XDG_DATA_HOME= XDG_CONFIG_HOME=
  R="$HOME/Applications/Free GST Billing"; S="$R/_system"
  mkdir -p "$S/data/bills" "$S/Saved Invoices/A" "$S/Trash" "$S/node_modules/x" "$HOME/.local/share/applications" "$HOME/.config/autostart" "$HOME/Documents/FreeGSTBill Backups" "$HOME/Applications/Free GST Billing.app/Contents/MacOS"
  echo 1 > "$S/server.js"; echo '[]' > "$S/data/bills.json"; echo p > "$S/Saved Invoices/A/1.pdf"
  echo l > "$R/Free GST Billing - LINUX.sh"; echo r > "$R/READ ME FIRST.txt"; echo mine > "$R/notes.txt"
  echo "Exec=sh \"$S/open-app.sh\"" > "$HOME/.local/share/applications/free-gst-billing.desktop"
  echo "Exec=sh \"$S/open-app.sh\"" > "$HOME/.config/autostart/free-gst-billing.desktop"
  echo "Exec=/other/place" > "$HOME/.local/share/applications/other.desktop"
  printf 'exec /bin/sh "%s/open-app.sh"\n' "$S" > "$HOME/Applications/Free GST Billing.app/Contents/MacOS/launch"
  echo old > "$HOME/Documents/FreeGSTBill Backups/old.zip"
  T=$(mktemp -d /tmp/fgsb-remove-XXXX); cp /s/uninstall-unix.sh "$T/"
}
setup; sh "$T/uninstall-unix.sh" "$S" 999999
check "keep all: data kept" '[ -f "$S/data/bills.json" ]'
check "keep all: pdfs kept" '[ -f "$S/Saved Invoices/A/1.pdf" ]'
check "keep all: program gone" '[ ! -e "$S/server.js" ] && [ ! -e "$S/node_modules" ]'
check "keep all: launchers gone, user file kept" '[ ! -e "$R/READ ME FIRST.txt" ] && [ ! -e "$R/Free GST Billing - LINUX.sh" ] && [ -f "$R/notes.txt" ]'
check "icons gone" '[ ! -e "$HOME/.local/share/applications/free-gst-billing.desktop" ] && [ ! -e "$HOME/.config/autostart/free-gst-billing.desktop" ] && [ ! -e "$HOME/Applications/Free GST Billing.app" ]'
check "other menu entry kept" '[ -f "$HOME/.local/share/applications/other.desktop" ]'
check "temp copy gone" '[ ! -e "$T" ]'
setup; sh "$T/uninstall-unix.sh" "$S" 999999 data
check "data only: data gone, pdfs kept" '[ ! -e "$S/data" ] && [ -f "$S/Saved Invoices/A/1.pdf" ]'
check "data only: last copy saved" 'ls "$HOME/Documents/FreeGSTBill Backups"/before-removal-*.tar.gz >/dev/null 2>&1 && tar -tzf "$HOME/Documents/FreeGSTBill Backups"/before-removal-*.tar.gz | grep -q data/bills.json'
setup; rm -f "$R/notes.txt"; sh "$T/uninstall-unix.sh" "$S" 999999 data pdfs backups
check "everything: app folder gone" '[ ! -e "$R" ]'
check "everything: backups gone" '[ ! -e "$HOME/Documents/FreeGSTBill Backups" ]'
# The last copy cannot be written (a file where the folder should be): data must stay.
setup; rm -rf "$HOME/Documents/FreeGSTBill Backups"; echo x > "$HOME/Documents/FreeGSTBill Backups"
sh "$T/uninstall-unix.sh" "$S" 999999 data
check "copy fails: data kept" '[ -f "$S/data/bills.json" ]'
setup; sh /s/uninstall-unix.sh "$S" 999999 2>/dev/null
check "run by hand from _system: _system not deleted" '[ -d "$S/data" ]'
exit $fail
