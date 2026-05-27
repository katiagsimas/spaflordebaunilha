import { useState } from 'react';

export function useModuleHelp() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const toggleHelp = () => setIsHelpOpen((prev) => !prev);
  const closeHelp = () => setIsHelpOpen(false);

  return { isHelpOpen, toggleHelp, closeHelp };
}
