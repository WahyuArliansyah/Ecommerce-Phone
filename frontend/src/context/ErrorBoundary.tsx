import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Terjadi error saat render:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="mx-auto max-w-xl p-6 text-slate-800">
        <h1 className="text-xl font-extrabold">Terjadi kesalahan</h1>
        <p className="mt-2 text-sm text-slate-600">Halaman ini gagal ditampilkan. Coba muat ulang.</p>
        <pre className="mt-4 overflow-auto rounded-lg bg-slate-100 p-3 text-xs text-rose-700">{this.state.error.message}</pre>
        <div className="mt-4 flex gap-2">
          <button onClick={() => window.location.reload()} className="h-10 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white">
            Muat ulang
          </button>
          <a href="/" className="flex h-10 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700">
            Ke beranda
          </a>
        </div>
      </div>
    );
  }
}