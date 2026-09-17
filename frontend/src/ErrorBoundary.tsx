import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  message: string | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { message: null }

  static getDerivedStateFromError(): State {
    return { message: 'The workbench hit an unexpected display error. Reload the page and try again.' }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Workbench UI error', { error: error.message, info })
  }

  render() {
    if (this.state.message) {
      return <p className="banner error">{this.state.message}</p>
    }
    return this.props.children
  }
}
