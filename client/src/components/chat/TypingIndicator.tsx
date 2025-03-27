import { motion } from 'framer-motion';

export default function TypingIndicator() {
  return (
    <div className="flex items-center space-x-1 pl-2 py-1">
      <motion.div
        className="h-2 w-2 bg-primary rounded-full"
        initial={{ opacity: 0.3 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 0.4,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      />
      <motion.div
        className="h-2 w-2 bg-primary rounded-full"
        initial={{ opacity: 0.3 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 0.4,
          repeat: Infinity,
          repeatType: 'reverse',
          delay: 0.2,
        }}
      />
      <motion.div
        className="h-2 w-2 bg-primary rounded-full"
        initial={{ opacity: 0.3 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 0.4,
          repeat: Infinity,
          repeatType: 'reverse',
          delay: 0.4,
        }}
      />
    </div>
  );
}