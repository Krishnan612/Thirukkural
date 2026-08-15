import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-5 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400 text-sm space-y-3 max-w-md mx-auto text-center font-sans-tamil my-4">
          <p className="font-bold flex items-center justify-center space-x-2">
            <span>⚠️</span>
            <span>ஏதோ தவறு நடந்தது / Something went wrong</span>
          </p>
          <p className="text-xs opacity-75 font-mono bg-paper-bg dark:bg-ink-bg p-2.5 rounded border border-paper-border dark:border-ink-border break-all max-h-24 overflow-y-auto">
            {this.state.error?.message || String(this.state.error)}
          </p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-colors duration-200 cursor-pointer active:scale-95 shadow-sm inline-block"
          >
            மீண்டும் முயலவும் / Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
