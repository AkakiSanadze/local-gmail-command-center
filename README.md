# 🚀 Local Gmail Command Center (2027-Ready)
> **Ultra-Fast, Zero-Dependency, Multi-Account Gmail Monitor & Assistant for Google Chrome (Manifest V3)**

---

## 🌟 მიმოხილვა (Overview)

**Local Gmail Command Center** არის შემდეგი თაობის (2027-Ready) Chrome ბრაუზერის ექსტენშენი, რომელიც შექმნილია 100%-ით სუფთა **Pure Vanilla Stack (HTML5, Modern CSS3, ES2024+)**-ზე ყოველგვარი გარე ბიბლიოთეკების, npm პაკეტების ან Google Cloud OAuth2 გასაღებების გარეშე.

ის იყენებს თქვენს ბრაუზერში უკვე აქტიურ Gmail-ის სესიებს ოფიციალური Atom Feed-ის მეშვეობით (`u/0`, `u/1`, `u/2`...), ამოწმებს წერილებს ფონურ რეჟიმში, აფრთხილებს მომხმარებელს ნეითივ აკუსტიკური Web Audio Chime სიგნალით, ავტომატურად პოულობს და აკოპირებს 2FA/OTP კოდებს და უზრუნველყოფს წერილების 1-წინადადებიან შეჯამებას ლოკალური AI-ით.

---

## ⚡ მთავარი ფუნქციონალი (Key Features)

### 1. 🔒 Zero-Config / Session-Based ავტორიზაცია
- არ საჭიროებს Google Cloud Console-ში პროექტის შექმნას, OAuth2 Client ID-ს ან API გასაღებებს.
- იყენებს Gmail-ის ოფიციალურ Atom Feed-ს (`mail.google.com/mail/u/{index}/feed/atom`) `credentials: 'include'` და `cache: 'no-store'` რეჟიმით.

### 2. 🎯 ზუსტი Icon Badge და სტატუსი
- წაუკითხავი წერილების ჯამური რაოდენობის ავტომატური დათვლა ყველა ჩართულ ექაუნთზე (`u/0`, `u/1`, `u/2`).
- **წერილები > 0:** მკაფიო რიცხვი Gmail-ის წითელ ფონზე (`#D93025`).
- **წერილები === 0:** ბეიჯი ავტომატურად სუფთავდება `""`.
- **არაავტორიზებული სესია (401):** ნაცრისფერი ბეიჯი `"?"` (`#5F6368`).

### 3. 🔊 Pure Web Audio API Chime სინთეზატორი
- `background.js` Service Worker-ი მართავს `offscreen.html`-ს.
- `offscreen.js`-ში ჩაშენებულია ორ-ტონიანი სინთეზატორი (D5 587.33Hz -> A5 880Hz) ჰარმონიული ოვერტონებითა და `exponentialRampToValueAtTime` მილევით.
- ნულოვანი გარე `.mp3` ფაილი — ხმა სინთეზირდება პირდაპირ კოდით!
- Settings-ში ჩაშენებულია ღილაკი **`🔊 ხმის შემოწმება (Test Sound)`**.

### 4. 📋 Smart OTP & 2FA კოდების დეტექტორი
- ინტელექტუალური რეგულარული გამოსახულებებით (Regex) ამოიცნობს 4-დან 8-ნიშნა ვერიფიკაციის კოდებს (მაგ: `482910`, `G-992104`, `58201`) როგორც ქართულ, ისე ინგლისურ ტექსტებში.
- წერილის კარტაზე მომენტალურად ჩნდება ღილაკი **`📋 კოდის კოპირება: [XXXX]`**, რომელიც 1 კლიკით აკოპირებს კოდს ბუფერში (Clipboard).

### 5. 🔕 VIP ფილტრი და Focus Mode (DND)
- **Focus Mode:** მომენტალური გაჩუმება (ხმისა და ნოთიფიკაციების დროებითი გათიშვა).
- **VIP ფილტრი:** შესაძლებლობა მიიღოთ ხმოვანი სიგნალი და ნოთიფიკაცია მხოლოდ VIP სიტყვების დამთხვევისას (მაგ: `urgent, invoice, სასწრაფო, კოდი, verification, გადახდა`).

### 6. 🤖 LM Studio AI Summary Bridge
- თითოეულ წერილს აქვს ღილაკი **`✨ AI Summary`**.
- პირდაპირ მიმართავს Settings-ში მითითებულ LM Studio Endpoint-ს (ნაგულისხმევად: `http://localhost:1234/v1/chat/completions` — LM Studio, Ollama, LocalAI) და უსაფრთხოდ გამოაქვს 1-წინადადებიანი შეჯამება (მათ შორის Reasoning მოდელების `<think>` ტეგების ავტომატური გაფილტვრით).

### 7. 📱 Dual UI: Popup (380px) + Chrome Side Panel (100%)
- ერთიანი ადაპტირებული ინტერფეისი როგორც პატარა Toolbar Popup-ისთვის (`380px`), ისე ბრაუზერის გვერდითა პანელისთვის (`100%`).
- Dark / Light / System თემების მხარდაჭერა (`color-scheme: light dark`).
- სწრაფი ძებნა (**Quick Filter**) გამომგზავნის, სათაურის, ტექსტის ან OTP კოდის მიხედვით.
- ღილაკი **`✍️ Compose`** ახალი წერილის გასახსნელად შესაბამის ექაუნთში.

---

## 🛠️ ინსტალაცია (Load Unpacked)

ექსტენშენი მუშაობს ყოველგვარი კომპილაციისა და build-ნაბიჯების გარეშე:

1. გახსენით Google Chrome და მისამართების ზოლში ჩაწერეთ:
   ```
   chrome://extensions/
   ```
2. მარჯვენა ზედა კუთხეში ჩართეთ **Developer mode** (დეველოპერის რეჟიმი).
3. დააჭირეთ მარცხენა ზედა ღილაკს **Load unpacked** (ჩაუტვირთავის ჩატვირთვა).
4. მონიშნეთ ეს ფოლდერი:
   ```
   /Users/akakisanadze/Desktop/Gmail Checker Extension
   ```
5. ექსტენშენი მყისიერად ჩაიტვირთება და მზად იქნება გამოსაყენებლად! დაამაგრეთ (Pin) მისი აიქონი ბრაუზერის ხელსაწყოთა პანელზე.

---

## 📁 ფაილების სტრუქტურა

```text
Gmail Checker Extension/
├── manifest.json       # Manifest V3 კონფიგურაცია, Permissions & Host Permissions
├── background.js      # Service Worker (Alarms, Atom Feed fetch, Badge, DND, Notifications)
├── offscreen.html      # Offscreen კონტექსტი DOMParser-ისა და Web Audio-სთვის
├── offscreen.js        # XML DOMParser, OTP Regex დეტექტორი, Web Audio Chime
├── popup.html          # Dual UI მარკაპი, Bento კარტები და Settings მოდალი
├── popup.css           # 2027 Bento სტილი, Native CSS Nesting, light-dark()
├── popup.js            # UI კონტროლერი, ტაბები, Quick Filter, Local AI Bridge
├── icons/              # AI-გენერირებული აიქონები
│   ├── icon-16.png     # 16x16px
│   ├── icon-48.png     # 48x48px
│   ├── icon-128.png    # 128x128px
│   └── icon-master.png # Master Artwork
└── README.md           # სრული დოკუმენტაცია
```

---

## 🔐 უსაფრთხოება და კონფიდენციალურობა (Privacy First)

- **ნულოვანი ტელემეტრია:** არცერთი ბაიტი არ იგზავნება მესამე მხარის სერვერებზე.
- **მხოლოდ ლოკალური შენახვა:** ყველა პარამეტრი და მეშების ქეში ინახება ბრაუზერის დაცულ `chrome.storage.local`-ში.
- **XSS დაცვა:** ყველა ტექსტური გამონატანი რენდერდება ნეითივ `textContent`-ით და HTML escaping-ით.
