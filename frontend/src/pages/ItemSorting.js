import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Heart, CurrencyDollar, HandHeart, Check, ArrowRight } from '@phosphor-icons/react';
import confetti from 'canvas-confetti';

export default function ItemSorting({ session, onSortItem, onDone, onBack }) {
  const items = session?.items || [];
  const [currentIndex, setCurrentIndex] = useState(
    items.findIndex(item => !item.decision)
  );
  const [animDirection, setAnimDirection] = useState(null);

  const currentItem = currentIndex >= 0 && currentIndex < items.length ? items[currentIndex] : null;
  const sortedCount = items.filter(i => i.decision).length;
  const totalItems = items.length;

  const handleSort = async (decision) => {
    if (!currentItem) return;
    
    setAnimDirection(decision);
    await onSortItem(currentItem.item_id, decision);

    if (decision === 'donate') {
      confetti({ particleCount: 20, spread: 40, origin: { y: 0.6 }, colors: ['#7FA898', '#A8BBA3'] });
    }

    // Move to next unsorted item
    setTimeout(() => {
      const nextIndex = items.findIndex((item, i) => i > currentIndex && !item.decision);
      if (nextIndex >= 0) {
        setCurrentIndex(nextIndex);
      } else {
        // Check if there are any unsorted items before current
        const anyUnsorted = items.findIndex(item => !item.decision && item.item_id !== currentItem.item_id);
        if (anyUnsorted >= 0) {
          setCurrentIndex(anyUnsorted);
        } else {
          setCurrentIndex(-1); // all done
        }
      }
      setAnimDirection(null);
    }, 300);
  };

  const categoryColors = {
    clothing: 'bg-sky/10 text-sky',
    electronics: 'bg-mist/10 text-mist',
    books: 'bg-clay/10 text-clay',
    kitchenware: 'bg-sage/10 text-sage',
    decor: 'bg-golden/10 text-golden',
    toys: 'bg-blush/10 text-blush',
    misc: 'bg-border text-mist',
  };

  const progress = totalItems > 0 ? (sortedCount / totalItems) * 100 : 0;

  return (
    <div className="min-h-screen flex flex-col" data-testid="item-sorting-page">
      {/* Header */}
      <nav className="flex items-center gap-4 px-6 md:px-12 py-6">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-sage/10 transition-colors" data-testid="back-button">
          <ArrowLeft weight="bold" className="text-bark text-xl" />
        </button>
        <div className="flex-1">
          <h2 className="font-heading text-xl font-medium text-bark">Sort your items</h2>
          <p className="font-body text-sm text-mist">
            {sortedCount} of {totalItems} sorted
          </p>
        </div>
      </nav>

      {/* Progress */}
      <div className="px-6 md:px-12 mb-8">
        <div className="w-full h-3 bg-border/50 rounded-full overflow-hidden" data-testid="sorting-progress-bar">
          <motion.div
            className="h-full bg-clay rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center px-6 md:px-12 pb-12">
        <AnimatePresence mode="wait">
          {currentItem ? (
            <motion.div
              key={currentItem.item_id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ 
                opacity: 0, 
                x: animDirection === 'keep' ? 100 : animDirection === 'donate' ? -100 : 0,
                y: animDirection === 'sell' ? -100 : 0,
              }}
              className="w-full max-w-lg space-y-6"
            >
              {/* Item card */}
              <div className="bg-white rounded-3xl p-10 shadow-soft border border-border/50 space-y-5" data-testid="item-card">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-body font-medium ${categoryColors[currentItem.category] || categoryColors.misc}`}>
                  {currentItem.category}
                </span>

                <h3 className="font-heading text-2xl md:text-3xl font-medium text-bark" data-testid="item-name">
                  {currentItem.name}
                </h3>

                <p className="font-body text-mist leading-relaxed" data-testid="item-description">
                  {currentItem.description}
                </p>

                {currentItem.suggestion && (
                  <div className="bg-sage/5 border border-sage/15 rounded-2xl p-4">
                    <p className="font-body text-sm text-sage-dark">
                      <span className="font-medium">AI suggestion:</span> {currentItem.suggestion} — {currentItem.reason}
                    </p>
                  </div>
                )}
              </div>

              {/* Sort buttons - large tap zones */}
              <div className="grid grid-cols-3 gap-3" data-testid="sort-buttons">
                <motion.button
                  onClick={() => handleSort('keep')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  data-testid="keep-button"
                  className="bg-sage/10 hover:bg-sage/20 border-2 border-sage/30 rounded-2xl py-6 flex flex-col items-center gap-2 transition-colors"
                >
                  <Heart weight="duotone" className="text-sage text-3xl" />
                  <span className="font-body font-medium text-sage-dark text-sm">Keep</span>
                </motion.button>

                <motion.button
                  onClick={() => handleSort('sell')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  data-testid="sell-button"
                  className="bg-golden/10 hover:bg-golden/20 border-2 border-golden/30 rounded-2xl py-6 flex flex-col items-center gap-2 transition-colors"
                >
                  <CurrencyDollar weight="duotone" className="text-golden text-3xl" />
                  <span className="font-body font-medium text-bark text-sm">Sell</span>
                </motion.button>

                <motion.button
                  onClick={() => handleSort('donate')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  data-testid="donate-button"
                  className="bg-clay/10 hover:bg-clay/20 border-2 border-clay/30 rounded-2xl py-6 flex flex-col items-center gap-2 transition-colors"
                >
                  <HandHeart weight="duotone" className="text-clay text-3xl" />
                  <span className="font-body font-medium text-clay-dark text-sm">Donate</span>
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="sorting-done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-lg text-center space-y-8"
              data-testid="sorting-complete"
            >
              <Check weight="duotone" className="text-6xl text-sage mx-auto" />
              <h3 className="font-heading text-3xl text-bark">All sorted!</h3>
              <p className="font-body text-mist text-lg">You've made decisions on everything. That takes real courage!</p>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-sage/10 rounded-2xl p-5 text-center">
                  <p className="font-heading text-2xl text-sage-dark font-semibold">{items.filter(i => i.decision === 'keep').length}</p>
                  <p className="font-body text-xs text-mist mt-1">Keep</p>
                </div>
                <div className="bg-golden/10 rounded-2xl p-5 text-center">
                  <p className="font-heading text-2xl text-golden font-semibold">{items.filter(i => i.decision === 'sell').length}</p>
                  <p className="font-body text-xs text-mist mt-1">Sell</p>
                </div>
                <div className="bg-clay/10 rounded-2xl p-5 text-center">
                  <p className="font-heading text-2xl text-clay font-semibold">{items.filter(i => i.decision === 'donate').length}</p>
                  <p className="font-body text-xs text-mist mt-1">Donate</p>
                </div>
              </div>

              <motion.button
                onClick={onDone}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                data-testid="done-sorting-button"
                className="w-full bg-sage text-white rounded-full py-5 text-lg font-body font-medium shadow-md hover:bg-sage-dark transition-colors flex items-center justify-center gap-3"
              >
                Continue
                <ArrowRight weight="bold" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
