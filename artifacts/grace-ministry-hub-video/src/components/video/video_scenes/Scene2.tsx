import { motion } from 'framer-motion';
import { typography, colors, sceneContainerClass, springSnappy, springSmooth } from '../system';

export function Scene2() {
  return (
    <motion.div
      key="scene2"
      className={sceneContainerClass}
      style={{ backgroundColor: colors.cream }}
      initial={{ clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ clipPath: 'circle(150% at 50% 50%)' }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <motion.img 
          src={`${import.meta.env.BASE_URL}images/creative-brief.jpg`}
          className="w-full h-full object-cover"
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ duration: 12, ease: "linear" }}
        />
        <div className="absolute inset-0 bg-cream/90 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 w-full h-full flex items-center px-24">
        <div className="w-1/2 pr-12">
          <motion.div
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ ...springSnappy, delay: 1.0, duration: 1.5 }}
          >
            <h3 className={`${typography.accent} text-teal mb-4`}>The Assistant</h3>
            <h2 className={`${typography.h2} text-deepNavy mb-6`}>
              Draft announcements, social posts, & briefs.
            </h2>
            <p className={`${typography.bodyLg} text-primaryNavy`}>
              Canva-ready creative briefs generated instantly. Focus on ministry, not blank pages.
            </p>
          </motion.div>
        </div>

        {/* Floating UI Elements */}
        <div className="w-1/2 relative h-[60%] perspective-1000">
          <motion.div
            className="absolute top-10 right-20 w-80 bg-white rounded-xl shadow-2xl p-6 border border-teal/20"
            initial={{ y: 100, opacity: 0, rotateY: 15 }}
            animate={{ y: 0, opacity: 1, rotateY: -5 }}
            transition={{ ...springSmooth, delay: 2.5, duration: 1.5 }}
          >
            <div className="w-12 h-12 bg-teal/10 rounded-full flex items-center justify-center mb-4">
               <span className="text-teal text-xl">✨</span>
            </div>
            <div className="h-4 w-3/4 bg-gray-200 rounded mb-3"></div>
            <div className="h-4 w-full bg-gray-100 rounded mb-2"></div>
            <div className="h-4 w-5/6 bg-gray-100 rounded"></div>
          </motion.div>

          <motion.div
            className="absolute bottom-10 left-10 w-96 bg-white rounded-xl shadow-2xl p-6 border border-gold/20"
            initial={{ y: 100, opacity: 0, rotateY: -15 }}
            animate={{ y: 0, opacity: 1, rotateY: 5 }}
            transition={{ ...springSmooth, delay: 4.0, duration: 1.5 }}
          >
            <h4 className="font-sans font-bold text-deepNavy mb-3">Social Media Draft</h4>
            <p className="font-sans text-sm text-gray-500 italic mb-4">"Join us this Sunday as we explore..."</p>
            <div className="flex gap-2">
              <div className="h-8 w-8 bg-gold/20 rounded"></div>
              <div className="h-8 w-8 bg-teal/20 rounded"></div>
              <div className="h-8 w-8 bg-primaryNavy/20 rounded"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}