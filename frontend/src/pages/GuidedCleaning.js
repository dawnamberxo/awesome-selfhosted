import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Clock, Sparkle, ArrowRight, Package } from '@phosphor-icons/react';
import confetti from 'canvas-confetti';

export default function GuidedCleaning({ session, onCompleteTask, onSortItems, onBack }) {
  const tasks = session?.tasks || [];
  const completedCount = session?.completed_tasks || 0;
  const totalTasks = session?.total_tasks || tasks.length;
  const streak = session?.streak || 0;

  // Find the first incomplete task
  const currentTaskIndex = tasks.findIndex(t => !t.completed);
  const currentTask = currentTaskIndex >= 0 ? tasks[currentTaskIndex] : null;
  const [justCompleted, setJustCompleted] = useState(false);

  const progress = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  const handleComplete = async () => {
    if (!currentTask) return;
    setJustCompleted(true);
    
    // Mini confetti
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#7FA898', '#F4D35E', '#E09F7D'],
    });

    await onCompleteTask(currentTask.task_id);
    
    setTimeout(() => setJustCompleted(false), 1500);
  };

  const categoryIcons = {
    pickup: '~',
    wipe: '~',
    organize: '~',
    sort: '~',
    celebrate: '~',
  };

  const categoryColors = {
    pickup: 'bg-sage/10 text-sage',
    wipe: 'bg-sky/10 text-sky',
    organize: 'bg-clay/10 text-clay',
    sort: 'bg-golden/10 text-golden',
    celebrate: 'bg-golden/10 text-golden',
  };

  return (
    <div className="min-h-screen flex flex-col" data-testid="guided-cleaning-page">
      {/* Header */}
      <nav className="flex items-center gap-4 px-6 md:px-12 py-6">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-sage/10 transition-colors" data-testid="back-button">
          <ArrowLeft weight="bold" className="text-bark text-xl" />
        </button>
        <div className="flex-1">
          <h2 className="font-heading text-xl font-medium text-bark">Cleaning in progress</h2>
          <p className="font-body text-sm text-mist">
            Step {completedCount + 1} of {totalTasks}
          </p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1 bg-golden/10 px-3 py-1.5 rounded-full" data-testid="streak-badge">
            <Sparkle weight="fill" className="text-golden text-sm" />
            <span className="font-body text-sm font-bold text-golden">{streak}</span>
          </div>
        )}
      </nav>

      {/* Progress bar */}
      <div className="px-6 md:px-12 mb-8">
        <div className="w-full h-3 bg-border/50 rounded-full overflow-hidden" data-testid="progress-bar">
          <motion.div
            className="h-full bg-sage rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            data-testid="progress-fill"
          />
        </div>
        <p className="font-body text-xs text-mist mt-2 text-right">{Math.round(progress)}% done</p>
      </div>

      <main className="flex-1 flex flex-col items-center px-6 md:px-12 pb-12">
        <AnimatePresence mode="wait">
          {currentTask ? (
            <motion.div
              key={currentTask.task_id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full max-w-lg space-y-6"
            >
              {/* Task card */}
              <div className="bg-white rounded-3xl p-10 shadow-soft border border-border/50 space-y-6" data-testid="current-task-card">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-body font-medium ${categoryColors[currentTask.category] || 'bg-sage/10 text-sage'}`}>
                    {currentTask.category}
                  </span>
                  {currentTask.estimated_minutes && (
                    <span className="inline-flex items-center gap-1 text-xs text-mist font-body">
                      <Clock weight="bold" />
                      ~{currentTask.estimated_minutes} min
                    </span>
                  )}
                </div>

                <h3 className="font-heading text-2xl md:text-3xl font-medium text-bark leading-snug" data-testid="task-title">
                  {currentTask.title}
                </h3>

                <p className="font-body text-mist leading-relaxed text-lg" data-testid="task-description">
                  {currentTask.description}
                </p>

                <div className="bg-sage/5 border border-sage/15 rounded-2xl p-5">
                  <p className="font-body text-sage-dark text-sm italic" data-testid="task-encouragement">
                    {currentTask.encouragement}
                  </p>
                </div>
              </div>

              {/* Complete button */}
              <motion.button
                onClick={handleComplete}
                disabled={justCompleted}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                data-testid="complete-task-button"
                className={`w-full rounded-full py-5 text-lg font-body font-medium shadow-md transition-all flex items-center justify-center gap-3 ${
                  justCompleted 
                    ? 'bg-golden text-bark' 
                    : 'bg-sage text-white hover:bg-sage-dark'
                }`}
              >
                {justCompleted ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-2"
                  >
                    <Sparkle weight="fill" className="text-xl" />
                    Amazing!
                  </motion.span>
                ) : (
                  <>
                    <Check weight="bold" className="text-xl" />
                    Done! What's next?
                  </>
                )}
              </motion.button>

              {/* Sort items shortcut */}
              <button
                onClick={onSortItems}
                data-testid="sort-items-shortcut"
                className="w-full text-center font-body text-sm text-mist hover:text-clay transition-colors flex items-center justify-center gap-2 py-2"
              >
                <Package weight="duotone" />
                Need to sort some items? Take a photo
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="all-done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
              data-testid="all-done-message"
            >
              <Sparkle weight="duotone" className="text-6xl text-golden mx-auto" />
              <h3 className="font-heading text-3xl text-bark">All tasks done!</h3>
              <p className="font-body text-mist text-lg">You are incredible. Every step counted.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Completed tasks scroll */}
        {completedCount > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full max-w-lg mt-10"
          >
            <h4 className="font-heading text-sm text-mist uppercase tracking-widest mb-4">Completed</h4>
            <div className="space-y-2">
              {tasks.filter(t => t.completed).map((task, i) => (
                <div key={task.task_id} className="flex items-center gap-3 opacity-60" data-testid={`completed-task-${i}`}>
                  <div className="w-6 h-6 rounded-full bg-sage flex items-center justify-center flex-shrink-0">
                    <Check weight="bold" className="text-white text-xs" />
                  </div>
                  <span className="font-body text-sm text-bark line-through">{task.title}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
