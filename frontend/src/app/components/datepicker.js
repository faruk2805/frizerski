'use client'
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight, FiCalendar } from 'react-icons/fi';

const DatePicker = ({ selected, onChange, minDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  
  const months = [
    'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni',
    'Juli', 'August', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
  ];

  const days = ['Ne', 'Po', 'Ut', 'Sr', 'Če', 'Pe', 'Su'];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const renderDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDayOfMonth = getFirstDayOfMonth(currentMonth);
    const daysArray = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      daysArray.push(<div key={`empty-${i}`} className="w-10 h-10" />);
    }

    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
      const isSelected = selected && date.toDateString() === selected.toDateString();
      const isDisabled = date < new Date(minDate.setHours(0, 0, 0, 0));

      daysArray.push(
        <motion.button
          key={`day-${i}`}
          whileHover={{ scale: isDisabled ? 1 : 1.05 }}
          whileTap={{ scale: isDisabled ? 1 : 0.95 }}
          onClick={() => !isDisabled && onChange(date)}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors
            ${isSelected ? 'bg-amber-500 text-white' : 
              isDisabled ? 'text-gray-500 cursor-not-allowed' : 
              'text-gray-200 hover:bg-gray-700'}`}
          disabled={isDisabled}
        >
          {i}
        </motion.button>
      );
    }

    return daysArray;
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowPicker(!showPicker)}
        className="flex items-center justify-between w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200"
      >
        <span>{selected ? selected.toLocaleDateString('hr-HR') : 'Odaberite datum'}</span>
        <FiCalendar className="text-amber-500" />
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
            <div className="flex justify-between items-center mb-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={prevMonth}
                className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white"
              >
                <FiChevronLeft />
              </motion.button>
              
              <h3 className="text-lg font-medium text-white">
                {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={nextMonth}
                className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white"
              >
                <FiChevronRight />
              </motion.button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {days.map((day) => (
                <div key={day} className="text-center text-sm text-gray-500 w-10">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {renderDays()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DatePicker;