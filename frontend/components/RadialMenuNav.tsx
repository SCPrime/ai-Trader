'use client';

import { useEffect, useRef } from 'react';

interface RadialMenuNavProps {
  onWorkflowSelect: (workflowId: string) => void;
}

export default function RadialMenuNav({ onWorkflowSelect }: RadialMenuNavProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from our iframe
      if (event.source === iframeRef.current?.contentWindow) {
        if (event.data?.type === 'workflow-selected' && event.data?.workflowId) {
          console.log('Radial menu selected:', event.data.workflowId);
          onWorkflowSelect(event.data.workflowId);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onWorkflowSelect]);

  return (
    <div className="radial-menu-wrapper">
      <iframe
        ref={iframeRef}
        src="/radial-ui.html"
        className="w-[600px] h-[700px] border-0 bg-transparent"
        title="Trading Workflow Navigation"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}
