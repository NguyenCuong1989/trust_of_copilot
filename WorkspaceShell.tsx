import type { ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/react';

export interface WorkspaceShellProps {
  children?: ReactNode;
}

export function WorkspaceShell({ children }: WorkspaceShellProps) {
  return (
    <section
      data-component="WorkspaceShell"
      data-feature="cloud-assisted-readback"
      data-dispatcher="sovereign"
      data-gemini-project="gen-lang-client-0863690953"
    >
      {children}
      <Analytics />
    </section>
  );
}

export default WorkspaceShell;
