# Running Free GST Billing Software online: not yet

An earlier version of this page described hosting the app on Railway, Render, Fly.io, Vercel + Supabase, a VPS or a Cloudflare Tunnel. **Don't follow those steps.** They do not work with the app as it is, and they are not safe:

- **There is no login on the server.** The app was made for one computer. Anyone who found the web address could read, change or delete every invoice, client and bank detail. The PIN lock only locks the screen in the browser.
- **The server only listens on the computer it runs on** (`127.0.0.1`), so a hosting service cannot reach it without a code change that removes that protection.
- **There is no database.** The app saves its books as files in its `data` folder, so Supabase would not be used. On most free hosting plans those files are wiped every time the service restarts.

The full answer, with what to do instead, is in the guide: [Can I put it online?](https://dicecodes.com/free-gst-software-documentation/security.html#host-online)

**Planned:** using the app from a phone or tablet on the **same Wi-Fi** as your computer, with a PIN that the app's server checks (update on Saturday 7 November 2026). Online use may come later, only after the app has a proper login of its own. This page will say so when it does.
