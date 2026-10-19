# Focus List

A calm, mobile-first app that keeps your **prayers and Quran reading, daily tasks, notes and projects** in one place.
No account, no server, no build step. Everything is saved on your own device.

## What is inside

| Screen   | What it does |
|----------|--------------|
| **Salah**    | Day-arc tracker for the five prayers plus a daily Quran goal. Scores each day out of 70 points (10 per prayer, 20 for Quran), with history, a monthly calendar, streaks and reminders. |
| **Tasks**    | Day planner with a 14-day strip. Tasks with no date wait in the **Inbox** (the first button in the strip). |
| **Notes**    | Rich-text notes with bold, lists, colors, pinning, plain-text download and print. |
| **Projects** | Boards with members and a To do / Doing / Done flow for each card. |
| **More**     | Reminders, 12/24-hour time, light/dark theme, install, share, backup, restore and reset. |

## Files

```
focuslist/
  index.html            the page
  style.css             all colors and layout (colors are in the two token blocks at the top)
  icon.svg              app icon
  manifest.webmanifest  lets the browser install it like an app
  sw.js                 service worker, makes it work offline
  README.md             this file
  js/
    utils.js            icons, helpers, toast, bottom sheet
    store.js            saving and loading data
    reminders.js        notifications
    tasks.js            Tasks screen
    notes.js            Notes screen
    projects.js         Projects screen
    settings.js         More screen
    salah.js            Salah screen (day arc, history, reminders)
    main.js             tabs, theme, button clicks, start-up
```

The scripts must stay in the order listed at the bottom of `index.html`.

## How to run it

**Quickest (works for everything except offline/install):**
double-click `index.html`. It opens in your browser and works.

**Best (enables offline use and "Install app"):** serve the folder on `localhost`.
Open a terminal inside the `focuslist` folder and run one of these:

```
python -m http.server 8000
```
or
```
npx serve .
```

Then open **http://localhost:8000** in your browser.
(On some systems the command is `python3` instead of `python`.)

**On your phone:**
1. Put the phone and computer on the same Wi-Fi and run the server above.
2. Find your computer's IP address (for example `192.168.1.20`) and open `http://192.168.1.20:8000` on the phone.
3. Notifications and install need a secure address, so for real daily use upload the folder to any free static host (GitHub Pages, Netlify, Cloudflare Pages) and open the `https://` link. Then choose **More > Install app** or your browser's "Add to Home Screen".

## Your data

- Saved in the browser's local storage under the key `focuslist-data-v1`. Nothing leaves your device.
- Clearing browser data erases it, so use **More > Export** now and then to download a backup, and **Import** to restore it.
- Data is per browser and per device. Export on one, import on the other to move it.

## Reminders

Turn them on in **More** or on the Salah **Reminders** tab. They fire while the app is open, or in the background where the browser allows it. Always keep a backup of important data.

## Customizing

- **Colors:** edit the two token blocks at the top of `style.css` (night and light).
- **App name:** change `<title>`, the header text in `index.html`, and `manifest.webmanifest`.
- **Points:** `MAX` and the scoring in `js/salah.js`.
