import React from "react"
import { ShieldAlert, RefreshCw, Home } from "lucide-react"
import { Button } from "./ui/Button"

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error("🔴 Error Boundary caught:", error, errorInfo)

    this.setState((prevState) => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }))

    // Log to external service (optional)
    if (window.__logError) {
      window.__logError({
        type: "ERROR_BOUNDARY",
        error: error.toString(),
        stack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      })
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleNavigateHome = () => {
    window.location.href = "/"
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-rose-50 via-white to-blue-50 p-4">
          <div className="premium-card p-8 max-w-lg w-full flex flex-col items-center space-y-6 bg-white border-none shadow-2xl rounded-2xl">
            {/* Icon */}
            <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center animate-pulse">
              <ShieldAlert className="w-8 h-8 text-rose-500" />
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight text-center">
              Something Went Wrong
            </h1>

            {/* Error Message */}
            <p className="text-slate-600 text-center leading-relaxed">
              Our team has been notified about this issue. Please try again or return to the home page.
            </p>

            {/* Error Details (Development only) */}
            {import.meta.env.DEV && this.state.error && (
              <details className="w-full">
                <summary className="cursor-pointer text-xs font-mono text-rose-600 font-bold hover:underline">
                  Error Details ({this.state.errorCount} occurrence{this.state.errorCount > 1 ? "s" : ""})
                </summary>
                <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg overflow-auto max-h-40">
                  <p className="font-mono text-xs text-rose-700 break-words whitespace-pre-wrap">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo?.componentStack && (
                    <p className="font-mono text-xs text-rose-600 mt-2 border-t border-rose-200 pt-2">
                      {this.state.errorInfo.componentStack}
                    </p>
                  )}
                </div>
              </details>
            )}

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
              <Button
                onClick={this.handleReset}
                className="flex-1 h-12 rounded-lg font-semibold shadow-lg hover:shadow-xl transition"
              >
                Try Again
              </Button>
              <Button
                onClick={this.handleNavigateHome}
                variant="outline"
                className="flex-1 h-12 rounded-lg font-semibold"
              >
                <Home className="w-4 h-4 mr-2" /> Home
              </Button>
            </div>

            {/* Reload option */}
            <button
              onClick={this.handleReload}
              className="text-sm text-slate-500 hover:text-slate-700 font-medium transition flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Reload Page
            </button>
          </div>

          {/* Footer */}
          <p className="mt-10 text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Shafransa Error Diagnostics
          </p>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
