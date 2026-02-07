'use client';

import { useEffect } from 'react';
import mermaid from 'mermaid';

export default function MermaidInit() {
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'dark'
    });
  }, []);

  return null;
}
