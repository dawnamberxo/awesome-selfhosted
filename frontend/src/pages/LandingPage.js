import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Camera, Sparkle, ArrowRight, Heart } from '@phosphor-icons/react';

export default function LandingPage({ onStart, loading }) {
  return (
    <div className="min-h-screen flex flex-col" data-testid="landing-page">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-2">
          <Leaf weight="duotone" className="text-sage text-2xl" />
          <span className="font-heading text-xl font-semibold text-bark">Nudge</span>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 md:px-12 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="max-w-2xl text-center space-y-8"
        >
          <div className="inline-flex items-center gap-2 bg-sage/10 text-sage-dark px-4 py-2 rounded-full text-sm font-body font-medium">
            <Sparkle weight="duotone" className="text-golden" />
            <span>No judgment. Just gentle nudges.</span>
          </div>

          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl leading-tight font-semibold text-bark" data-testid="hero-title">
            Cleaning feels hard?
            <br />
            <span className="text-sage">Let's start small.</span>
          </h1>

          <p className="font-body text-lg md:text-xl text-mist leading-relaxed max-w-lg mx-auto" data-testid="hero-subtitle">
            Take a photo of your space, and we'll break it down into tiny, 
            doable steps. One thing at a time. You've got this.
          </p>

          <motion.button
            data-testid="start-button"
            onClick={onStart}
            disabled={loading}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="bg-sage text-white hover:bg-sage-dark rounded-full px-10 py-5 text-lg font-body font-medium transition-colors shadow-md hover:shadow-lg inline-flex items-center gap-3 disabled:opacity-60"
          >
            {loading ? (
              <span className="breathing-loader inline-block">Getting ready...</span>
            ) : (
              <>
                <Camera weight="duotone" className="text-xl" />
                Start Cleaning
                <ArrowRight weight="bold" />
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full"
        >
          {[
            { icon: Camera, title: 'Snap your space', desc: 'Take a photo and AI figures out where to begin' },
            { icon: Sparkle, title: 'Tiny steps', desc: 'Each task is small enough to start right now' },
            { icon: Heart, title: 'Sort with ease', desc: 'Keep, sell, or donate — we help you decide' },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.15 }}
              className="bg-white rounded-3xl p-8 shadow-soft border border-border/50 hover:border-sage/30 transition-colors"
              data-testid={`feature-card-${i}`}
            >
              <feature.icon weight="duotone" className="text-3xl text-sage mb-4" />
              <h3 className="font-heading text-lg font-medium text-bark mb-2">{feature.title}</h3>
              <p className="font-body text-mist text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
