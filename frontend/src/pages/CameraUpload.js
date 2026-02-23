import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, UploadSimple, ArrowLeft, Image, X, FlowerLotus, Package } from '@phosphor-icons/react';
import Webcam from 'react-webcam';

export default function CameraUpload({ onAnalyze, onIdentifyItems, loading, onBack }) {
  const [mode, setMode] = useState(null); // 'camera', 'upload', or null
  const [preview, setPreview] = useState(null);
  const [actionType, setActionType] = useState('analyze'); // 'analyze' or 'identify'
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setPreview(imageSrc);
      setMode(null);
    }
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target.result);
      setMode(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!preview) return;
    // Extract base64 data (remove data:image/...;base64, prefix)
    const base64 = preview.split(',')[1];
    if (actionType === 'identify') {
      onIdentifyItems(base64);
    } else {
      onAnalyze(base64);
    }
  };

  const clearPreview = () => {
    setPreview(null);
    setMode(null);
  };

  return (
    <div className="min-h-screen flex flex-col" data-testid="camera-upload-page">
      {/* Header */}
      <nav className="flex items-center gap-4 px-6 md:px-12 py-6">
        <button 
          onClick={onBack} 
          data-testid="back-button"
          className="p-2 rounded-full hover:bg-sage/10 transition-colors"
        >
          <ArrowLeft weight="bold" className="text-bark text-xl" />
        </button>
        <h2 className="font-heading text-2xl font-medium text-bark">Capture your space</h2>
      </nav>

      <main className="flex-1 flex flex-col items-center px-6 md:px-12 pb-12">
        <AnimatePresence mode="wait">
          {/* No preview - show options */}
          {!preview && mode === null && (
            <motion.div
              key="options"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-lg space-y-8 mt-8"
            >
              <p className="font-body text-mist text-center text-lg leading-relaxed">
                Show me the space you'd like to tackle. 
                No need for it to look "bad enough" — every space counts!
              </p>

              <div className="space-y-4">
                <motion.button
                  data-testid="camera-option"
                  onClick={() => setMode('camera')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-white rounded-3xl p-8 shadow-soft border border-border/50 hover:border-sage/40 transition-all flex items-center gap-6"
                >
                  <div className="w-14 h-14 rounded-2xl bg-sage/10 flex items-center justify-center flex-shrink-0">
                    <Camera weight="duotone" className="text-sage text-2xl" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-heading text-lg font-medium text-bark">Take a photo</h3>
                    <p className="font-body text-sm text-mist mt-1">Use your camera to snap a picture</p>
                  </div>
                </motion.button>

                <motion.button
                  data-testid="upload-option"
                  onClick={() => fileInputRef.current?.click()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-white rounded-3xl p-8 shadow-soft border border-border/50 hover:border-clay/40 transition-all flex items-center gap-6"
                >
                  <div className="w-14 h-14 rounded-2xl bg-clay/10 flex items-center justify-center flex-shrink-0">
                    <UploadSimple weight="duotone" className="text-clay text-2xl" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-heading text-lg font-medium text-bark">Upload a photo</h3>
                    <p className="font-body text-sm text-mist mt-1">Choose from your gallery</p>
                  </div>
                </motion.button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileUpload}
                className="hidden"
                data-testid="file-input"
              />
            </motion.div>
          )}

          {/* Camera mode */}
          {mode === 'camera' && (
            <motion.div
              key="camera"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg space-y-6 mt-4"
            >
              <div className="relative rounded-3xl overflow-hidden bg-bark aspect-[4/3]">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  screenshotQuality={0.8}
                  videoConstraints={{ facingMode: 'environment', width: 1280, height: 960 }}
                  className="w-full h-full object-cover"
                  data-testid="webcam"
                />
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setMode(null)}
                  className="bg-white border-2 border-border text-bark rounded-full px-6 py-3 font-body font-medium transition-all hover:border-sage"
                  data-testid="cancel-camera"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={capture}
                  whileTap={{ scale: 0.9 }}
                  className="bg-sage text-white rounded-full px-8 py-3 font-body font-medium shadow-md hover:bg-sage-dark transition-colors flex items-center gap-2"
                  data-testid="capture-button"
                >
                  <Camera weight="fill" />
                  Capture
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Preview mode */}
          {preview && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-lg space-y-6 mt-4"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-soft">
                <img src={preview} alt="Your space" className="w-full aspect-[4/3] object-cover" data-testid="preview-image" />
                <button
                  onClick={clearPreview}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
                  data-testid="clear-preview"
                >
                  <X weight="bold" className="text-bark" />
                </button>
              </div>

              <p className="font-body text-mist text-center text-sm">
                Looking good! What would you like to do with this space?
              </p>

              {/* Action type selector */}
              <div className="flex gap-3">
                <button
                  onClick={() => setActionType('analyze')}
                  data-testid="action-analyze"
                  className={`flex-1 rounded-2xl p-4 border-2 transition-all flex flex-col items-center gap-2 ${
                    actionType === 'analyze' 
                      ? 'border-sage bg-sage/5 text-sage-dark' 
                      : 'border-border bg-white text-mist hover:border-sage/30'
                  }`}
                >
                  <FlowerLotus weight="duotone" className="text-2xl" />
                  <span className="font-body text-sm font-medium">Guide me to clean</span>
                </button>
                <button
                  onClick={() => setActionType('identify')}
                  data-testid="action-identify"
                  className={`flex-1 rounded-2xl p-4 border-2 transition-all flex flex-col items-center gap-2 ${
                    actionType === 'identify' 
                      ? 'border-clay bg-clay/5 text-clay-dark' 
                      : 'border-border bg-white text-mist hover:border-clay/30'
                  }`}
                >
                  <Package weight="duotone" className="text-2xl" />
                  <span className="font-body text-sm font-medium">Sort my items</span>
                </button>
              </div>

              <motion.button
                onClick={handleSubmit}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                data-testid="submit-photo"
                className="w-full bg-sage text-white rounded-full py-4 text-lg font-body font-medium shadow-md hover:bg-sage-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="breathing-loader">Analyzing your space...</span>
                ) : (
                  <>
                    <Image weight="duotone" />
                    {actionType === 'analyze' ? 'Analyze My Space' : 'Identify Items'}
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
