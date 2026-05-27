import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    (this as any).state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    (this as any).setState({
      hasError: true,
      error,
      errorInfo
    });
  }

  public render() {
    const state = (this as any).state as State;
    if (state.hasError) {
      const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';

      return (
        <div id="error-boundary-container" className="min-h-screen flex items-center justify-center bg-slate-950 p-6 text-slate-100">
          <div className="w-full max-w-lg bg-slate-900 border border-red-500/30 rounded-xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600" />
            
            <div className="flex items-center gap-3 mb-4">
              <span className="p-2 rounded-lg bg-red-500/10 text-red-500 text-lg">⚠️</span>
              <h2 className="text-xl font-semibold tracking-tight text-white">Something went wrong</h2>
            </div>
            
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              We encountered an unexpected error and the application had to crash.
            </p>

            {state.error && (
              <div className="bg-slate-950/60 rounded-lg p-4 font-mono text-xs text-red-400 mb-6 max-h-48 overflow-auto border border-red-950">
                <div className="font-bold underline mb-1">Error: {state.error.message}</div>
                {isDev && state.errorInfo && (
                  <pre className="mt-2 text-[10px] text-slate-400 leading-normal whitespace-pre-wrap">
                    {state.error.stack}
                    {"\n\nComponent Stack:\n"}
                    {state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <button
              id="reload-app-button"
              onClick={() => window.location.reload()}
              className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors cursor-pointer shadow-lg shadow-red-900/10 focus:outline-none"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

export default ErrorBoundary;
