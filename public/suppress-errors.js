// Global error suppression for development
(function() {
  if (typeof window !== 'undefined') {
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = function(...args) {
      const message = args.join(' ').toLowerCase();
      if (
        message.includes('failed to fetch') ||
        message.includes('network request failed') ||
        message.includes('fetch error') ||
        message.includes('connection error') ||
        message.includes('rpc error') ||
        message.includes('walletconnect')
      ) {
        return; // Suppress these errors
      }
      originalError.apply(console, args);
    };
    
    console.warn = function(...args) {
      const message = args.join(' ').toLowerCase();
      if (
        message.includes('failed to fetch') ||
        message.includes('network') ||
        message.includes('rpc')
      ) {
        return; // Suppress these warnings
      }
      originalWarn.apply(console, args);
    };
  }
})();
