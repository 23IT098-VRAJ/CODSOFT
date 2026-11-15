import React from 'react';

// Catches rendering errors anywhere below it, so one broken component shows
// a friendly message instead of a blank white page.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-2xl font-bold text-midnight">Something went wrong</h1>
        <p className="text-smoke mt-2 max-w-sm">An unexpected error occurred while showing this page.</p>
        <button onClick={() => window.location.assign('/')} className="btn-primary mt-6">Back to home</button>
      </div>
    );
  }
}
