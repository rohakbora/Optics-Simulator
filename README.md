# Optical Designer App

An interactive optical design application with AI-powered setup generation using LLMs via OpenRouter.

## Features

- 🎨 **Interactive Canvas**: Click to place optical components on a grid
- 🔧 **Component Library**: Laser sources, mirrors, beam splitters, lenses, and detectors
- 🚀 **Real-time Ray Tracing**: See light paths update instantly
- 🤖 **AI Assistant**: Generate complete optical setups using natural language
- 📊 **Detector Readings**: Monitor light intensity and wavelength at detectors
- 💾 **Export/Import**: Save and load optical configurations as JSON

## Components Available

- **Laser Source**: Configurable wavelength, intensity, and angle
- **Plane Mirror**: Adjustable reflectivity, angle, and length
- **Beam Splitter**: Controllable reflectivity and rotation
- **Convex/Concave Lens**: Focal length, transparency, diameter
- **Light Detector**: Sensitivity and size controls

## Quick Start

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Backend Setup (for AI Features)

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
```powershell
.\venv\Scripts\Activate.ps1
```

4. Install Python dependencies:
```bash
pip install -r requirements.txt
```

5. Set your OpenRouter API key:
```powershell
$env:OPENROUTER_API_KEY="your-api-key-here"
```

6. Start the backend server:
```bash
python app.py
```

Or simply run:
```powershell
.\start-backend.ps1
```

The backend will be available at `http://localhost:5000`

## Getting an OpenRouter API Key

1. Sign up at [OpenRouter](https://openrouter.ai/)
2. Go to your account settings
3. Create a new API key
4. Set it as an environment variable (see Backend Setup step 5)

## Usage

### Manual Component Placement

1. Click on a component in the left sidebar
2. Click anywhere on the grid to place it (components snap to grid)
3. Drag components to reposition them
4. Select a component to adjust its properties in the right panel
5. Delete selected components with the Delete button

### AI-Powered Generation

1. Click the "AI Assistant" button in the left sidebar
2. Describe the optical setup you want (e.g., "Create a Michelson interferometer")
3. Click "Generate Setup"
4. The AI will generate and place all components automatically

### Export Configuration

Click "Export JSON" to download your current setup as a JSON file.

## Technology Stack

- **Frontend**: React, Vite, TailwindCSS, Lucide Icons
- **Backend**: Python, Flask, OpenRouter API
- **Ray Tracing**: Custom JavaScript implementation
- **Deployment**: Vercel (see [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md))

## Deployment

This app is ready to deploy on Vercel. See the [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) guide for detailed instructions on deploying both frontend and backend.
