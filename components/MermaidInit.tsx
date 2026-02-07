'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import mermaid from 'mermaid';

export default function MermaidInit() {
  const pathname = usePathname();

  useEffect(() => {
    // Initialize mermaid configuration
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose', // Allow for more complex diagrams if needed
      fontFamily: 'var(--font-sans)', // Use app font if possible
    });

    // Run mermaid on all elements with class 'mermaid'
    // We wrap in a small timeout to ensure the DOM is ready after navigation
    const timeoutId = setTimeout(() => {
      mermaid.run({
        querySelector: '.mermaid',
      });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [pathname]);

  return null;
}
