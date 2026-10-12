import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Icon } from './Icon';

export function Modal({
  children,
  onClose,
  titleId,
  className = '',
}: {
  children: ReactNode;
  onClose: () => void;
  titleId: string;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = original;
      previousFocus?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            onClose();
        }
      }}
    >
      <button
        type="button"
        className="icon-button modal-close"
        aria-label="Pencereyi kapat"
        onClick={onClose}
      >
        <Icon name="close" size={28} />
      </button>
      {children}
    </dialog>
  );
}
