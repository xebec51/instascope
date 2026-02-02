# InstaScope 📊

InstaScope is a simple, privacy-friendly web application to analyze Instagram followers and following relationships using **officially exported Instagram JSON data**.

This app helps you identify:
- Users who **don’t follow you back**
- Users you **don’t follow back**
- **Mutual followers**

All data processing is done **locally in the browser** — no API, no login, no data sent to any server.

---

## ✨ Features

- 📂 Upload Instagram **followers & following JSON files**
- 🔍 Detect:
  - Mutual followers
  - Not follow back
  - You don’t follow back
- 🔎 Search usernames in real-time
- 🔗 Click username to open **Instagram profile**
- 📊 Clear statistics overview
- 🔢 Count displayed on each category button
- 🔒 100% client-side (privacy-first)

---

## 🧠 How It Works

1. Export your Instagram data from **Instagram Settings**
2. Upload:
   - `followers_1.json`
   - `following.json`
3. InstaScope parses and compares the data
4. Results are displayed instantly in your browser

---

## 🛠️ Tech Stack

- **React**
- **Vite**
- **JavaScript (ES6+)**
- **CSS (Global + Inline dynamic styles)**

No backend. No database. No Instagram API.

---

## 📁 Project Structure

```

instascope/
├─ src/
│  ├─ components/
│  │  ├─ FileUpload.jsx
│  │  └─ ResultList.jsx
│  ├─ utils/
│  │  └─ instagramParser.js
│  ├─ App.jsx
│  ├─ main.jsx
│  └─ index.css
├─ index.html
└─ README.md

````

---

## 🚀 Getting Started

### 1️⃣ Clone Repository
```bash
git clone https://github.com/xebec51/instascope.git
cd instascope
````

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Run Development Server

```bash
npm run dev
```

Open in browser:

```
http://localhost:5173
```

---

## 📦 Instagram Data Export Guide

1. Go to **Instagram Settings**
2. Select **Accounts Center**
3. Choose **Your Information and Permissions**
4. Select **Download Your Information**
5. Request data in **JSON format**
6. After download, locate:

   ```
   connections/followers_and_following/
   ├─ followers_1.json
   └─ following.json
   ```

---

## 🔐 Privacy & Security

* No login required
* No data uploaded to any server
* No third-party tracking
* Runs fully offline after loading

Your data stays **on your device**.

---

## 📈 Future Improvements

* Export results to CSV
* Copy usernames to clipboard
* Save last analysis using localStorage
* UI theming / dark mode
* Mobile optimization

---

## 👤 Author

**Muh. Rinaldi Ruslan**
Information Systems Student
Hasanuddin University

---

## 📄 License

This project is licensed under the **MIT License**.

```
