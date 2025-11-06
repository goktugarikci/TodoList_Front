import React, { Fragment, ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';

interface SlideOverPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'md' | 'lg' | 'xl';
}

const SlideOverPanel: React.FC<SlideOverPanelProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'lg',
}) => {
  const sizeClasses = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        
        {/* 1. Arka Plan (Overlay) */}
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-opacity-70 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel
                  className={`pointer-events-auto w-screen ${sizeClasses[size]}`}
                >
                  {/* Panel İçeriği: Koyu Gri (bg-zinc-800) */}
                  <div className="flex h-full flex-col overflow-y-scroll bg-zinc-800 shadow-xl">
                    
                    {/* Panel Başlığı: Kömür (bg-zinc-900) */}
                    <div className="bg-zinc-900 px-4 py-6 sm:px-6 border-b border-zinc-700"> 
                      <div className="flex items-center justify-between">
                        {/* Başlık Rengi: Sarı (text-amber-400) */}
                        <Dialog.Title className="text-xl font-semibold leading-6 text-amber-400">
                          {title}
                        </Dialog.Title>
                        <button
                          type="button"
                          className="rounded-md text-zinc-400 hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
                          onClick={onClose}
                        >
                          <span className="sr-only">Kapat</span>
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Panel İçeriği (Kaydırılabilir): Metin Rengi Beyaz (text-zinc-100) */}
                    <div className="relative flex-1 px-4 py-6 sm:px-6 text-zinc-100">
                      {children}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default SlideOverPanel;