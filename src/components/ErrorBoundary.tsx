import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  onResetRoute?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected application error occurred.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Application ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050814] text-slate-100 flex items-center justify-center px-6">
          <div className="max-w-lg w-full rounded-2xl border border-white/10 bg-[#0A1024] p-8 space-y-5">
            <p className="text-xs font-medium text-cyan-400">SkillConnect Official · Recovery</p>
            <h1 className="text-2xl font-bold text-white">Something interrupted this view</h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              We caught an unexpected error while rendering this section. You can reload the page or return safely to the home portal.
            </p>
            <p className="text-xs font-mono text-slate-400 break-words bg-[#050814] p-3 rounded-lg border border-white/10">
              {this.state.errorMessage}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, errorMessage: '' });
                  if (this.props.onResetRoute) this.props.onResetRoute();
                }}
                className="px-4 py-2.5 rounded-lg bg-cyan-500 text-slate-950 text-sm font-semibold hover:bg-cyan-400 transition-colors cursor-pointer"
              >
                Return Home
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2.5 rounded-lg border border-white/15 text-slate-200 text-sm font-medium hover:bg-white/5 transition-colors cursor-pointer"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
