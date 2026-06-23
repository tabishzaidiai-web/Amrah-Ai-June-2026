import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tabs: { id: string; label: string }[];
  activeTab: string;
  setActiveTab: (id: string) => void;
}

export const NavigationDrawer: React.FC<DrawerProps> = ({ isOpen, onClose, tabs, activeTab, setActiveTab }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-64 bg-white z-[101] shadow-2xl p-6 flex flex-col"
          >
            <button onClick={onClose} className="self-end p-2 text-emerald-950">
              <X size={24} />
            </button>
            <div className="mt-8 flex flex-col gap-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    onClose();
                  }}
                  className={`text-sm font-bold uppercase tracking-widest text-left p-2 ${
                    activeTab === tab.id ? 'text-gold' : 'text-emerald-950'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
