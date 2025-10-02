'use client'
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock } from 'react-icons/fi';
import { useState, useEffect } from 'react';

const TimePicker = ({ availableSlots, selectedSlot, onSelectSlot }) => {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowPicker(!showPicker)}
        className="flex items-center justify-between w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200"
      >
        <span>{selectedSlot ? selectedSlot.formattedTime : 'Odaberite vrijeme'}</span>
        <FiClock className="text-amber-500" />
      </motion.button>

      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-10 mt-2 w-full bg-gray-900 border border-gray-800 rounded-lg shadow-lg p-4"
          >
            <h3 className="text-lg font-medium text-white mb-3">Dostupni termini</h3>
            
            {availableSlots.length === 0 ? (
              <p className="text-gray-500 text-center py-2">Nema dostupnih termina</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {availableSlots.map((slot, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      onSelectSlot(slot);
                      setShowPicker(false);
                    }}
                    className={`py-2 px-3 rounded-md text-sm font-medium transition-all
                      ${selectedSlot?.start.getTime() === slot.start.getTime()
                        ? 'bg-amber-500 text-black'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-200'}`}
                  >
                    {slot.formattedTime}
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TimePicker;