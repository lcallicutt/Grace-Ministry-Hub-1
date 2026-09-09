import { motion } from 'framer-motion';
import graceLogo from '@assets/grace_ministry_hub_logo_1788727901203.png';
import { typography, colors, sceneContainerClass, springSnappy, springSmooth } from '../system';

export function Scene5() {
  return (
    <motion.div
      key="scene5"
      className={sceneContainerClass}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2 }}
    >
      {/* Cinematic Background */}
      <div className="absolute inset-0">
         <motion.img 
          src={`${import.meta.env.BASE_URL}images/church-background.jpg`}
          className="w-full h-full object-cover"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1.05 }}
          transition={{ duration: 9, ease: "linear" }}
        />
        <div className="absolute inset-0 bg-deepNavy/80 backdrop-blur-sm mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-deepNavy via-deepNavy/80 to-transparent" />
      </div>

      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center px-16">
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ ...springSnappy, delay: 1.0, duration: 1.5 }}
          className="flex flex-col items-center"
        >
          <img 
            src={graceLogo}
            alt="Grace Ministry Hub Logo"
            className="h-40 object-contain mb-8 filter drop-shadow-2xl brightness-0 invert" 
          />
          
          <h1 className={`${typography.h1} text-cream mb-6`}>
            Grace Ministry Hub
          </h1>
          <p className={`${typography.bodyLg} text-cream/80 max-w-2xl`}>
            The operating system for modern ministry.
          </p>
        </motion.div>

        {/* Decorative Elements */}
        <motion.div
          className="absolute bottom-20 flex gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springSmooth, delay: 2.5, duration: 1.5 }}
        >
          <div className="w-16 h-1 bg-gold rounded-full" />
          <div className="w-4 h-1 bg-teal rounded-full" />
          <div className="w-4 h-1 bg-cream/30 rounded-full" />
        </motion.div>

      </div>
    </motion.div>
  );
}