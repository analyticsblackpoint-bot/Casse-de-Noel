# North Pole World Juniors

Our team pod's Christmas concept: a cardboard hockey rink presented by RBC, with a jumbotron, championship banners, a Zamboni, air hockey, a penalty box by the pillar, themed desks, and window advent calendar. Open the page, spin the 3D model, and drop ideas in the suggestion box. No sign-in needed.

## Files

| File | What it is |
| --- | --- |
| `index.html` | The 3D model and the suggestion box UI |
| `suggestions.js` | Saves and lists ideas through Firebase |
| `firebase-config.js` | Your Firebase web config (empty until set up) |
| `firestore.rules` | Who can read, add and delete ideas |

## Connect the suggestion box (about 10 minutes, free)

1. Go to <https://console.firebase.google.com> and **Create a project** (Google Analytics is not needed).
2. **Build → Firestore Database → Create database.** Pick a Canadian location (`northamerica-northeast1`, Montréal) and start in production mode.
3. In Firestore, open the **Rules** tab, replace everything with the contents of `firestore.rules`, and **Publish**.
4. **Build → Authentication → Get started → Sign-in method → Anonymous → Enable.**
5. **Authentication → Settings → Authorized domains → Add domain:** `analyticsblackpoint-bot.github.io`
6. **Project settings (gear) → Your apps → Web (`</>`)**, register an app, and copy the `firebaseConfig` object.
7. Paste it into `firebase-config.js` as `window.FIREBASE_CONFIG = { ... };` and commit.

The config values are safe to publish. The rules are what protect the data.

## Running the box

- **Mark an idea as built:** Firestore → `suggestions` → pick the document → change `status` to `in-model`. It shows a yellow "In the model" tag on the page.
- **Remove spam:** delete the document in the console. People can also remove their own ideas from the same browser they used.
- **Export the list:** ask Claude, or copy from the console.

The free Spark plan covers far more traffic than a team suggestion box will see.
