# FitNotes - Gym Workout Log

A fast, clean, distraction-free gym workout log and fitness tracker clone inspired by the legendary Android/iOS app **FitNotes**. Built with React 19, TypeScript, Vite, and Tailwind CSS.

---

## Features

- **Workout Day Log**
  - Date navigation with quick "Today" jump and date selector.
  - Metrics ribbon: Total exercises, completed sets, and total volume.
  - Exercise cards with sets table: Set #, Set Type (Normal, Warmup, Drop, Failure), Weight, Reps, Estimated 1RM, and completion checkbox.
  - Fast **"Copy Last Set"** and **"+ Add Set"** actions.
  - Personal Record (PR) celebration with confetti when breaking personal bests.

- **Integrated Rest Timer**
  - Floating/docked rest timer overlay with countdown and progress bar.
  - Quick adjust controls (`+30s`, Pause / Resume, Stop).
  - Audio alert (via Web Audio API) and haptic feedback.
  - Automatic launch upon set completion.

- **Monthly Calendar**
  - Month calendar grid with workout dot indicators and tonnage totals.
  - Selected day preview card with direct "Go to Workout" navigation.

- **Exercise Database & History**
  - 60+ pre-configured exercises categorized into Chest, Back, Legs, Shoulders, Arms, Core, and Cardio.
  - Custom Exercise Creator (Name, Category, Tracking metric).
  - Dedicated **Exercise History & PR view** with all-time personal bests, progression curve chart, and chronological workout history.

- **Track & Analytics**
  - Interactive strength progression graphs (Estimated 1RM, Max Weight, Total Volume) across customizable time ranges (1M, 3M, 6M, All Time).
  - Muscle group volume distribution breakdown.
  - Personal Records Trophy Hall.

- **Gym Utilities & Calculators**
  - **Barbell Plate Calculator**: Visual Olympic barbell diagram showing exact color-coded plates to load per side (45/35/25/10/5/2.5 lbs or 25/20/15/10/5/2.5/1.25 kg).
  - **1RM Calculator**: Epley & Brzycki formula calculators with full working percentage table (100% to 50%).
  - **Warmup Generator**: Progressive warmup set sequence based on working set weight.
  - **Manual Rest Timer**: Quick duration presets (30s to 5m).

- **Workout Routines & Templates**
  - Pre-built routines: Push / Pull / Legs (PPL), Upper / Lower 4-Day, Strength 5x5.
  - Custom Routine Split Builder.
  - 1-tap "Load into Today" to populate sessions immediately.

- **Offline-First & Data Backup**
  - Complete `localStorage` persistence.
  - Official FitNotes-compatible **CSV Export** (`Date, Exercise, Category, Weight, Reps, Distance, Time, Comment`).
  - Full **JSON Backup & Restore**.
  - Metric switcher (`lbs` $\leftrightarrow$ `kg`) with live weight conversion.

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/<your-repo-name>.git

# Navigate into project directory
cd <your-repo-name>

# Install dependencies
npm install

# Start local dev server
npm run dev
```

Visit `http://localhost:3000` to view the app.

---

## Build for Production

```bash
npm run build
```

---

## Native Mobile Deployment (Android & iOS)

To package this app as a native mobile app for Google Play Store or Apple App Store:

### Using Capacitor

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init fitnotes com.fitnotes.app --web-dir dist
npm run build
npx cap add android
npx cap add ios
npx cap open android
```

---

## License

Apache-2.0
