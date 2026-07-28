# Liquid Glass Editor

My first real React project — an interactive editor for the "liquid glass" UI effect. Drag a glass shape around the screen and tune its refraction, blur, tint, and specular highlights in real time.

Built to learn spring-based animation, global state management with Zustand, and canvas-based color sampling for dynamic contrast.

## Features

- 🖱️ **Draggable glass shape** with spring physics (adjustable elasticity: low / medium / high)
- 🎛️ **Live parameter controls** — blur, saturation, refraction strength, rim width, tint, chromatic aberration, and more
- 🔤 **Adaptive text overlay** that samples the background under the glass and switches color for readability
- 🖼️ **Multiple shape types** — rounded rectangle, circle, pill
- ⌨️ **Keyboard-accessible** — move the shape with arrow keys, hold Shift for bigger steps
- 🎨 **Custom backgrounds**, including uploaded images

## Tech Stack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) for dev/build tooling
- [Framer Motion](https://www.framer.com/motion/) for spring-based drag animation
- [Zustand](https://github.com/pmndrs/zustand) for state management
- Canvas API for background color sampling

## Getting Started

```bash
# clone the repo
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>

# install dependencies
npm install

# start the dev server
npm run dev
```

Then open the local URL (usually `http://localhost:5173`).

## Usage

- **Drag** the glass shape anywhere on the canvas.
- Use the **control panel** to adjust shape type, elasticity, blur, refraction, tint, and other glass parameters live.
- Change the **background** to see how the glass refracts different scenes, or upload your own image.
- Edit the **overlay text** — its color automatically adapts to stay readable against whatever's behind the glass.

## What I Learned

This project was my introduction to:
- Coordinating multiple sources of truth (drag target vs. animated spring output vs. global store) without them fighting each other
- Debugging animation timing issues — spring physics look simple until two effects start racing
- Sampling pixel data from a canvas to drive UI decisions in real time
- Structuring a small React app with clean separation between state, components, and utilities

## License

This project is for personal/portfolio use. Feel free to fork and experiment.
