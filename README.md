# Focus List

A calm, mobile-first app that keeps your **prayers and Quran reading, daily tasks, notes and projects** in one place.
No account, no server, no build step. Everything is saved on your own device.

## Open the app

**Just open this link in your browser and the app loads:**

### https://shaafmalik111.github.io/FocusList/

Nothing to download or sign up for. It works on phones, tablets and computers.

## Add it to your home screen (use it like an app)

Open the link above in your browser first, then:

**Android (Chrome)**
1. Tap the **three dots** at the top right.
2. Tap **Install app** (or **Add to Home screen**).
3. Tap **Install**. The Focus List icon now appears on your home screen.

**iPhone / iPad (Safari)**
1. Tap the **Share** button (the square with an arrow).
2. Scroll down and tap **Add to Home Screen**.
3. Tap **Add**.

**Computer (Chrome or Edge)**
Click the **install icon** at the right end of the address bar, then click **Install**.

You can also use **More > Install app** inside Focus List.

Tip: open it from the home screen icon after that, and it runs full screen like a normal app.

## What is inside

| Screen   | What it does |
|----------|--------------|
| **Salah**    | Day-arc tracker for the five prayers plus a daily Quran goal. Scores each day out of 70 points (10 per prayer, 20 for Quran), with history, a monthly calendar, streaks and reminders. |
| **Tasks**    | Day planner with a 14-day strip. Tasks with no date wait in the **Inbox** (the first button in the strip). |
| **Notes**    | Rich-text notes with bold, lists, colors, pinning, plain-text download and print. |
| **Projects** | Boards with members and a To do / Doing / Done flow for each card. |
| **More**     | Reminders, 12/24-hour time, light/dark theme, install, share, backup, restore and reset. |

## Files

All files sit together in one folder (no sub-folders):

```
index.html            the page
style.css             all colors and layout (colors are in the two token blocks at the top)
icon.svg              app icon
manifest.webmanifest  lets the browser install it like an app
sw.js                 service worker, makes it work offline
README.md             this file
utils.js              icons, helpers, toast, bottom sheet
store.js              saving and loading data
reminders.js          notifications
tasks.js              Tasks screen
notes.js              Notes screen
projects.js           Projects screen
settings.js           More screen
salah.js              Salah screen (day arc, history, reminders)
main.js               tabs, theme, button clicks, start-up
```

The scripts must stay in the order listed at the bottom of `index.html`.

## Run it on your own computer

**Quickest:** double-click `index.html`. It opens in your browser and works (offline and install are not available this way).

**Full features:** serve the folder on `localhost`. Open a terminal inside the folder and run one of these:

```
python -m http.server 8000
```
or
```
npx serve .
```

Then open **http://localhost:8000**. (On some systems the command is `python3` instead of `python`.)

## Publish it yourself (GitHub Pages)

1. Create a public repository and upload all the files above to the top level (not inside a folder).
2. Go to **Settings > Pages**, choose **Deploy from a branch**, branch **main**, folder **/ (root)**, and Save.
3. After a minute or two your link appears: `https://YOURNAME.github.io/REPONAME/`.

## Your data

- Saved in the browser's local storage under the key `focuslist-data-v1`. Nothing leaves your device.
- Clearing browser data erases it, so use **More > Export** now and then to download a backup, and **Import** to restore it.
- Data is per browser and per device. Export on one, import on the other to move it.
- The home-screen app and the browser tab on the same device share the same data.

## Reminders

Turn them on in **More** or on the Salah **Reminders** tab. They fire while the app is open, or in the background where the browser allows it. Always keep a backup of important data.

## Customizing

- **Colors:** edit the two token blocks at the top of `style.css` (night and light).
- **App name:** change `<title>`, the header text in `index.html`, and `manifest.webmanifest`.
- **Points:** `MAX` and the scoring in `salah.js`.
