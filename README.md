# Super Kart Bros 🏎️🍄

A retro-style kart racing game built with **React**, **TypeScript**, and **Vite**. Features a Mario Kart-inspired theme, boss fights, and an "AI" level generator!


## 🎮 Play Live
[**Play Super Kart Bros**](https://super-mario-kart-902002915057.asia-south1.run.app/)

## ✨ Features
<img width="1867" height="916" alt="image" src="https://github.com/user-attachments/assets/3ba8b27b-3bb4-45be-a241-cfe0cce50ac0" />

- **Full Screen Mobile Support:** Optimized for touch controls and plays full-screen on any mobile device.
- **Mario Theme:**
  - Classic "Press Start 2P" typography.
  - Rolling green hills and checkerboard backgrounds.
  - Retro sound effects and visuals.
- **Dynamic Level Generation:**
  - Type *anything* into the level generator and play a unique track named after your prompt!
  - Choose from 5 distinct themes: Speedway, Labyrinth, Sky Jump, Volcano, and Ghost Valley.
- **Boss Fights:**
  - Complete tracks to face the **Giant Orange Tabby Cat Boss**.
  - Special low-gravity "Moon Physics" during boss battles.
- **Multiple Difficulties:**
  - **Easy:** Relaxed pace, wide gaps.
  - **Medium:** Faster speed, tricky piranha plants.
  - **Hard:** High speed, fire flowers, and precise jumps.

## 📸 Screenshots

### Gameplay
*Race through pipes, avoid Goombas, and collect coins!*

### Boss Battle
*Defeat the giant cat boss in low gravity!*

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript
- **Styling:** Tailwind CSS
- **Build Tool:** Vite
- **Deployment:** Google Cloud Run (Dockerized)
- **Icons:** Lucide React

## 🚀 Local Development

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/monty/Super-mario-kart.git
    cd Super-mario-kart
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run development server:**
    ```bash
    npm run dev
    ```

4.  **Build for production:**
    ```bash
    npm run build
    ```

## ☁️ Deployment (Google Cloud Run)

This project includes a `Dockerfile` and `nginx.conf` for easy container deployment.

```bash
# Build and submit image
gcloud builds submit --tag gcr.io/[PROJECT_ID]/super-kart-bros

# Deploy to Cloud Run
gcloud run deploy super-kart-bros \
  --image gcr.io/[PROJECT_ID]/super-kart-bros \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated
```

## 📜 License
MIT
