import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-surface rounded-xl border border-rose-800/60 p-8 my-6 text-center max-w-2xl mx-auto shadow-lg">
          <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-700 text-rose-400 flex items-center justify-center mx-auto mb-4 text-xl">
            ⚠️
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-2">
            {this.props.title || "Component Rendering Error"}
          </h3>
          <p className="text-xs text-text-secondary mb-4 leading-relaxed">
            A display issue occurred while rendering this view. Your data is safe.
          </p>
          {this.state.error && (
            <div className="bg-surface-elevated p-3 rounded-lg border border-border/80 text-left font-mono text-[11px] text-rose-300 mb-6 overflow-x-auto max-h-36">
              {this.state.error.toString()}
            </div>
          )}
          <div className="flex justify-center gap-3">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white font-medium text-xs rounded-lg transition-colors"
            >
              Retry View
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-surface-elevated hover:bg-surface-elevated/80 text-text-secondary hover:text-text-primary text-xs rounded-lg border border-border transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
