import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex min-h-[50vh] items-center justify-center p-6">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h2 className="font-display text-2xl text-surface-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-surface-500 text-sm mb-6">
              {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
            </p>
            <Button onClick={this.handleReset}>Try again</Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
