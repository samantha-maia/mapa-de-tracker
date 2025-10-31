import React from 'react'

type Props = { children: React.ReactNode }
type State = { error?: Error }
let lastStack = ''

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = {}

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Runtime error:', error, info)
    lastStack = info.componentStack || ''
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-4 text-red-700">
          <div className="font-semibold">Ocorreu um erro</div>
          <pre className="whitespace-pre-wrap text-sm">{String(this.state.error.message)}</pre>
          {lastStack ? (
            <pre className="mt-2 whitespace-pre-wrap text-xs opacity-80">{lastStack}</pre>
          ) : null}
        </div>
      )
    }
    return this.props.children
  }
}


