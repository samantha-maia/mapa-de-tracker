import { Canvas } from './components/Canvas'

export default function App() {
  return (
    <div className="flex h-screen flex-col">
      <header className="border-b bg-white p-3">
        <h1 className="text-lg font-semibold">Criar Seção</h1>
      </header>
      <div className="min-h-0 flex-1">
        <Canvas />
      </div>
    </div>
  )
}
