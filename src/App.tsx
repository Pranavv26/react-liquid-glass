import GlassCanvas from './components/GlassCanvas'
import GlassShape from './components/GlassShape'
import TextOverlay from './components/TextOverlay'
import ControlPanel from './components/ControlPanel'

export default function App() {
  return (
    <div className="relative w-full h-full bg-canvas-bg overflow-hidden select-none">
      <div data-canvas-container className="absolute inset-0">
        <GlassCanvas />
        <GlassShape>
          <TextOverlay />
        </GlassShape>
      </div>
      <ControlPanel />
    </div>
  )
}
