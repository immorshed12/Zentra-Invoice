import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[40px] p-12 shadow-2xl text-center space-y-8 border border-red-50">
        <div className="h-24 w-24 bg-red-50 rounded-[40px] flex items-center justify-center mx-auto text-red-500 animate-pulse">
          <AlertTriangle className="h-12 w-12" />
        </div>
        
        <div className="space-y-3">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">Something went wrong</h1>
          <p className="text-gray-500 font-medium leading-relaxed">
            An unexpected error occurred. Please try reloading the page.
          </p>
        </div>

        <div className="bg-gray-50 rounded-3xl p-6 text-left">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Error Log</p>
          <p className="text-xs font-mono text-red-600 break-all">{error?.message || 'Unknown'}</p>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={() => {
              resetErrorBoundary();
              window.location.reload();
            }}
            className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-5 w-5" />
            Reload
          </button>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full py-5 bg-gray-100 text-gray-900 font-black rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
          >
            <Home className="h-5 w-5" />
            Home
          </button>
        </div>
      </div>
    </div>
  );
}

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ReactErrorBoundary FallbackComponent={ErrorFallback}>
      {children}
    </ReactErrorBoundary>
  );
}
