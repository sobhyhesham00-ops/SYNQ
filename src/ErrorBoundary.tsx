import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode; fallback?: React.ReactNode }, { hasError: boolean; error?: Error }> {
  public state = {
    hasError: false,
    error: undefined as Error | undefined
  };

  public static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="p-4 bg-red-900/50 text-red-100 rounded-xl whitespace-pre-wrap font-mono text-xs z-50 relative">
          <b>Messaging System Error:</b><br/>
          {this.state.error?.toString()}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
