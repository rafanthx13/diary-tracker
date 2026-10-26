"use client";

import { useEffect } from "react";

export function useUnsavedChangesWarning(hasUnsavedChanges: boolean, isSubmitting: boolean) {
  useEffect(() => {
    if (!hasUnsavedChanges || isSubmitting) return;

    const message = "Você tem alterações não salvas. Deseja sair mesmo assim?";
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const handleDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;

      const destination = new URL(link.href, window.location.href);
      if (destination.href === window.location.href) return;
      if (!window.confirm(message)) event.preventDefault();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [hasUnsavedChanges, isSubmitting]);
}
