import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Star, Clock, MapPin, Sparkle } from '@phosphor-icons/react';

const difficultyLabels = {
  1: { text: 'Quick Tidy', color: 'text-sage', bg: 'bg-sage/10' },
  2: { text: 'Light Work', color: 'text-sage', bg: 'bg-sage/10' },
  3: { text: 'Medium Effort', color: 'text-golden', bg: 'bg-golden/10' },
  4: { text: 'Deep Clean', color: 'text-clay', bg: 'bg-clay/10' },
  5: { text: 'Big Project', color: 'text-blush', bg: 'bg-blush/10' },
};

export default function AnalysisView({ session, onStartCleaning, loading, onBack }) {
  const analysis = session?.analysis;
  if (!analysis) return null;

  const diff = difficultyLabels[analysis.difficulty] || difficultyLabels[3];

  return (
    <div className="min-h-screen flex flex-col" data-testid="analysis-page">
      {/* Header */}
      <nav className="flex items-center gap-4 px-6 md:px-12 py-6">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-sage/10 transition-colors" data-testid="back-button">
          <ArrowLeft weight="bold" className="text-bark text-xl" />
        </button>
        <h2 className="font-heading text-2xl font-medium text-bark">Your space report</h2>
      </nav>

      <main className="flex-1 px-6 md:px-12 pb-12 max-w-3xl mx-auto w-full space-y-8">
        {/* Encouragement banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-sage/8 border border-sage/20 rounded-3xl p-8 text-center"
          data-testid="encouragement-banner"
        >
          <Sparkle weight="duotone" className="text-golden text-3xl mx-auto mb-3" />
          <h3 className="font-heading text-2xl text-bark mb-2">You can do this!</h3>
          <p className="font-body text-mist leading-relaxed">{analysis.encouragement}</p>
        </motion.div>

        {/* Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-8 shadow-soft border border-border/50"
          data-testid="overview-card"
        >
          <p className="font-body text-bark leading-relaxed text-lg">{analysis.overview}</p>
          <div className="flex flex-wrap gap-3 mt-6">
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-body font-medium ${diff.bg} ${diff.color}`}>
              <Star weight="fill" />
              {diff.text}
            </span>
          </div>
        </motion.div>

        {/* Quick Win */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-golden/8 border border-golden/20 rounded-3xl p-8"
          data-testid="quick-win-card"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-golden/20 flex items-center justify-center flex-shrink-0">
              <Sparkle weight="fill" className="text-golden text-xl" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-medium text-bark mb-1">Start here (Quick Win!)</h3>
              <p className="font-body text-mist leading-relaxed">{analysis.quick_win}</p>
            </div>
          </div>
        </motion.div>

        {/* Zones */}
        <div className="space-y-4">
          <h3 className="font-heading text-xl text-bark">Areas to tackle</h3>
          {analysis.zones?.map((zone, i) => (
            <motion.div
              key={zone.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-soft border border-border/50 flex items-start gap-4"
              data-testid={`zone-card-${i}`}
            >
              <div className="w-10 h-10 rounded-xl bg-sage/10 flex items-center justify-center flex-shrink-0 font-body font-bold text-sage">
                {zone.priority || i + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="font-heading text-base font-medium text-bark">{zone.name}</h4>
                  {zone.estimated_minutes && (
                    <span className="inline-flex items-center gap-1 text-xs text-mist font-body">
                      <Clock weight="bold" className="text-xs" />
                      ~{zone.estimated_minutes}min
                    </span>
                  )}
                </div>
                <p className="font-body text-sm text-mist leading-relaxed">{zone.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="pt-4"
        >
          <motion.button
            onClick={onStartCleaning}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            data-testid="start-cleaning-button"
            className="w-full bg-sage text-white rounded-full py-5 text-lg font-body font-medium shadow-md hover:bg-sage-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-3"
          >
            {loading ? (
              <span className="breathing-loader">Creating your plan...</span>
            ) : (
              <>
                Let's Start Cleaning!
                <ArrowRight weight="bold" />
              </>
            )}
          </motion.button>
        </motion.div>
      </main>
    </div>
  );
}
