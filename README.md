# 🚀 Local Gmail Command Center (Chrome + Firefox MV3)
> **Zero-Dependency, Multi-Account Gmail Monitor, Smart OTP Detector & Optional Local AI Assistant**

---

## 🌟 მიმოხილვა (Overview)

**Local Gmail Command Center** არის Chrome-ისა და Firefox-ის (Manifest V3) ბრაუზერის ექსტენშენი, რომელიც აწყობილია 100%-ით სუფთა **Vanilla Stack (HTML5, Modern CSS3, ES2024+ ES Modules)**-ზე — ყოველგვარი გარე npm პაკეტების, bundler-ების ან Google Cloud OAuth2 გასაღებების გარეშე.

ის იყენებს ბრაუზერში უკვე აქტიურ Gmail სესიებს ოფიციალური Atom Feed-ის მეშვეობით (`u/0`, `u/1`, `u/2`...), ამოწმებს წერილებს ფონურ რეჟიმში, აფრთხილებს მომხმარებელს Web Audio API Chime სიგნალით, ავტომატურად პოულობს და 1 კლიკით აკოპირებს 2FA/OTP კოდებს, იძლევა წერილების წაკითხულად მონიშვნისა და წაშლის საშუალებას და სურვილისამებრ აჯამებს წერილებს ლოკალური **LM Studio** სერვერით.

---

## ⚡ მთავარი ფუნქციონალი

- **Zero-Config სესიები:** იყენებს Gmail Atom Feed-ს (`mail.google.com/mail/u/{index}/feed/atom`) ბრაუზერის აქტიური ქუქიებით.
- **ზუსტი Badge & სტატუსი:** წაუკითხავი წერილების ჯამური რაოდენობა (`999+`-მდე) აიქონზე და იდენტური `fullcount` რაოდენობა ტაბების ბეიჯებზე; არაავტორიზებულ სესიაზე `"?"` ინდიკატორი.
- **Cross-Browser MV3 არქიტექტურა:**
  - **Google Chrome:** `Service Worker` + `Offscreen Document` (`DOMParser` & Web Audio) + `Side Panel`.
  - **Mozilla Firefox:** `Background Event Page` (პირდაპირი `DOMParser` & Web Audio) + `Sidebar Action`.
- **Smart OTP / 2FA დეტექტორი:** ამოიცნობს 4–8-ნიშნა და `G-XXXXXX` ფორმატის კოდებს ქართულ და ინგლისურ წერილებში (კალენდარული წლების დინამიური ფილტრაციით).
- **Zero-Tab მოქმედებები:** ერთი წერილის ან გაფილტრული სიის წაკითხულად მონიშვნა და წაშლა (2-კლიკიანი დადასტურებით Delete All-ზე), `GMAIL_AT` ტოკენების ექაუნთებს შორის იზოლაციით.
- **VIP ფილტრი & Focus Mode (DND):** შეტყობინებების ფილტრაცია VIP სიტყვების მიხედვით ან სრული გაჩუმება.
- **LM Studio AI შეჯამება:** სურვილისამებრ აგზავნის მოთხოვნას ლოკალურ LM Studio endpoint-ზე (`127.0.0.1` / `localhost` fallback + timeout დაცვა + `<think>` გაფილტვრა).
- **Dark / Light / System თემა:** სინქრონიზებული Popup-სა და Side Panel / Sidebar-ს შორის.

---

## 🛠️ აწყობა და ინსტალაცია (Build & Load)

პროექტს არ სჭირდება `npm install` (ნულოვანი გარე დამოკიდებულება). საჭიროა მხოლოდ Node.js (v20+).

### 1. ექსტენშენის აწყობა

```bash
# Chrome (dist/chrome/) და Firefox (dist/firefox/) ვერსიების აწყობა
npm run build

# .zip (Chrome) და .xpi (Firefox) არქივების შექმნა dist/ ფოლდერში
npm run pack
```

### 2. Google Chrome-ში ჩატვირთვა
1. გახსენით `chrome://extensions/`
2. ჩართეთ **Developer mode**
3. დააჭირეთ **Load unpacked** და აირჩიეთ `dist/chrome/` ფოლდერი.

### 3. Mozilla Firefox-ში ჩატვირთვა
1. გახსენით `about:debugging#/runtime/this-firefox`
2. დააჭირეთ **Load Temporary Add-on...**
3. აირჩიეთ `dist/firefox/manifest.json`.

---

## 🧪 ტესტირება (Zero-Dependency Test Suite)

GitHub-ზე ატვირთვამდე გაუშვით სრული შემოწმება (ბილდი + სინტაქსის ვალიდაცია + მანიფესტების შემოწმება + ყველა `node:test` ერთეული და ინტეგრაციული ტესტი):

```bash
npm run check
```

ცალკე მხოლოდ ტესტების გასაშვებად:
```bash
npm test
```

---

## 📁 პროექტის სტრუქტურა

```text
├── manifests/
│   ├── chrome.json        # Chrome MV3 მანიფესტი
│   └── firefox.json       # Firefox MV3 მანიფესტი (gecko + sidebar_action)
├── scripts/
│   └── build.mjs          # Zero-dependency ბილდ სკრიპტი -> dist/{chrome,firefox}
├── src/
│   ├── background.js      # Cross-browser Service Worker / Event Page
│   ├── offscreen.html     # Chrome-only Offscreen HTML
│   ├── offscreen.js       # Chrome-only Offscreen Worker
│   ├── popup.html         # ერთიანი HTML (sidepanel.html გენერირდება ბილდისას)
│   ├── popup.css          # Bento CSS (light-dark(), native nesting)
│   ├── popup.js           # Dual-mode UI კონტროლერი
│   └── shared/            # საერთო ES მოდულები (IDs, OTP, VIP, Atom, Audio, UI ლოგიკა)
├── tests/                 # Zero-dependency node:test ტესტები და მოკები
├── icons/                 # 16/48/128 PNG აიქონები (+ icon-master.png)
├── package.json           # მხოლოდ სკრიპტები (dependencies გარეშე)
└── CHROMEWEBSTORE.md      # Store listing & permissions დოკუმენტაცია
```

---

## 🔐 კონფიდენციალურობა და უსაფრთხოება

- **ნულოვანი ტელემეტრია:** არცერთი მონაცემი არ იგზავნება მესამე მხარის სერვერებზე.
- **ლოკალური შენახვა:** პარამეტრები და ქეში ინახება მხოლოდ `storage.local` / `storage.session`-ში.
- **ლოკალური AI:** LM Studio-ს შეჯამება მუშაობს მხოლოდ მომხმარებლის ლოკალურ მანქანაზე (`127.0.0.1` / `localhost`) და მხოლოდ ღილაკზე დაჭერისას.
