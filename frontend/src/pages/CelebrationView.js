import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkle, ArrowRight, Camera, Trophy, Star } from '@phosphor-icons/react';
import confetti from 'canvas-confetti';

export default function CelebrationView({ session, onStartOver, onContinue }) {
  const completedTasks = session?.completed_tasks || 0;
  const totalTasks = session?.total_tasks || 0;
  const streak = session?.streak || 0;
  const items = session?.items || [];
  const sortedItems = items.filter(i => i.decision);

  useEffect(() => {
    // Big celebration confetti
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#7FA898', '#F4D35E', '#E09F7D', '#E8B49A'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#7FA898', '#F4D35E', '#E09F7D', '#E8B49A'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 md:px-12" data-testid="celebration-page">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="max-w-lg w-full text-center space-y-10"
      >
        {/* Trophy */}
        <motion.div
          initial={{ y: -30 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        >
          <Trophy weight="duotone" className="text-golden text-7xl mx-auto" />
        </motion.div>

        {/* Message */}
        <div className="space-y-4">
          <h1 className="font-heading text-4xl md:text-5xl font-semibold text-bark" data-testid="celebration-title">
            You did it!
          </h1>
          <p className="font-body text-lg text-mist leading-relaxed" data-testid="celebration-message">
            Every step you took matters. You showed up for yourself today, and that's what counts.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4" data-testid="stats-grid">
          {completedTasks > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-sage/10 rounded-3xl p-6"
            >
              <Sparkle weight="fill" className="text-sage text-2xl mx-auto mb-2" />
              <p className="font-heading text-3xl font-semibold text-sage-dark">{completedTasks}</p>
              <p className="font-body text-xs text-mist mt-1">Tasks completed</p>
            </motion.div>
          )}

          {streak > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-golden/10 rounded-3xl p-6"
            >
              <Star weight="fill" className="text-golden text-2xl mx-auto mb-2" />
              <p className="font-heading text-3xl font-semibold text-bark">{streak}</p>
              <p className="font-body text-xs text-mist mt-1">Task streak</p>
            </motion.div>
          )}

          {sortedItems.length > 0 && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-clay/10 rounded-3xl p-6"
              >
                <p className="font-heading text-3xl font-semibold text-clay-dark">{sortedItems.length}</p>
                <p className="font-body text-xs text-mist mt-1">Items sorted</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-white rounded-3xl p-6 border border-border/50"
              >
                <p className="font-heading text-3xl font-semibold text-bark">
                  {items.filter(i => i.decision === 'donate').length}
                </p>
                <p className="font-body text-xs text-mist mt-1">To donate</p>
              </motion.div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-4 pt-4">
          <motion.button
            onClick={onContinue}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            data-testid="continue-button"
            className="w-full bg-sage text-white rounded-full py-5 text-lg font-body font-medium shadow-md hover:bg-sage-dark transition-colors flex items-center justify-center gap-3"
          >
            <Camera weight="duotone" />
            Tackle another space
            <ArrowRight weight="bold" />
          </motion.button>

          <button
            onClick={onStartOver}
            data-testid="start-over-button"
            className="w-full text-mist hover:text-bark font-body text-sm transition-colors py-3"
          >
            Start fresh
          </button>
        </div>
      </motion.div>
    </div>
  );
}
