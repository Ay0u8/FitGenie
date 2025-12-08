# FitGenie 🏋️‍♂️

An AI-powered personalized workout plan generator built with Next.js and Groq AI.

![FitGenie](https://img.shields.io/badge/Next.js-16.0.7-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.2.0-blue?logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?logo=tailwind-css)
![Groq AI](https://img.shields.io/badge/Groq-AI-orange)

## 📋 Overview

FitGenie is a web application that generates personalized workout plans based on user profiles, including:
- **Fitness goals** (Build muscle, Lose fat, General fitness, Strength, Endurance)
- **Experience level** (Beginner, Intermediate, Advanced)
- **Available equipment**
- **Injuries/limitations** with an interactive body map
- **Personal preferences**

## ✨ Features

- 🤖 **AI-Powered Plans**: Uses Groq AI (Llama model) to generate customized workout routines
- 🗺️ **Interactive Body Map**: Click on body parts to indicate injuries/discomfort areas (front & back view)
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 💬 **AI Chat Assistant**: Get fitness advice and ask questions about your workout
- 🎨 **Modern UI**: Dark theme with smooth animations using Tailwind CSS

## 🛠️ Tech Stack

- **Framework**: Next.js 16.0.7 (App Router)
- **UI Library**: React 19.2.0
- **Styling**: Tailwind CSS 4.x
- **AI**: Groq SDK (Llama model)
- **Components**: Radix UI, Lucide Icons
- **Language**: TypeScript

## 📦 Prerequisites

- [Node.js](https://nodejs.org/) v18.17 or later
- npm (comes with Node.js), yarn, or pnpm
- A [Groq API Key](https://console.groq.com/) (free tier available)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ay0u8/FitGenie.git
   cd FitGenie
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```
   
   Get your free API key from [Groq Console](https://console.groq.com/)

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open the app**
   
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser

## 📁 Project Structure

```
FitGenie/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/          # AI chat endpoint
│   │   │   └── generate-workout/  # Workout generation endpoint
│   │   ├── chat/              # Chat page
│   │   ├── planner/           # Workout planner page
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   └── ui/                # Reusable UI components
│   └── lib/
│       ├── groq.ts            # Groq AI client setup
│       ├── prompts.ts         # AI prompt templates
│       └── utils.ts           # Utility functions
├── public/                    # Static assets
├── package.json               # Dependencies
├── requirements.txt           # Installation guide
└── README.md
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## 🌐 Pages

- **/** - Home/Landing page
- **/planner** - Workout plan generator with body map
- **/chat** - AI fitness assistant chat

## 🔑 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GROQ_API_KEY` | Your Groq API key for AI features | Yes |

## 📝 Usage

1. Navigate to the **Planner** page
2. Fill in your training profile:
   - Select your fitness goal
   - Choose your experience level
   - Enter available equipment
   - Mark any injuries on the interactive body map (click expand for larger view)
   - Add any preferences
3. Click **Generate workout plan**
4. View your personalized AI-generated workout routine

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📄 License

This project is for educational purposes (Generative AI course - S5).

## 👨‍💻 Author

**Ayoub** - [GitHub](https://github.com/Ay0u8)

**Filip** - [GitHub](https://github.com/FilZek04)

---

Made with ❤️ using Next.js and Groq AI

