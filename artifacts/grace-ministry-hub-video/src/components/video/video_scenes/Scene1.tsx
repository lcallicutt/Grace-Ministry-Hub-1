import { motion } from 'framer-motion';
import graceLogo from '@assets/grace_ministry_hub_logo_1788727901203.png';
import { typography, colors, sceneContainerClass, easeOutSmooth, springSmooth } from '../system';

export function Scene1() {
  return (
    <motion.div
      key="scene1"
      className={sceneContainerClass}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: easeOutSmooth }}
    >
      <div className="absolute inset-0 bg-deepNavy" />
      
      {/* Background texture element */}
      <motion.div
        className="absolute inset-0 opacity-20"
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.2 }}
        transition={{ duration: 8, ease: "linear" }}
        style={{
          backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(25,119,128,.5), transparent 45%), radial-gradient(circle at 80% 75%, rgba(230,183,56,.2), transparent 40%)',
          backgroundSize: 'cover',
        }}
      />

      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center px-16">
        
        <motion.div 
          className="mb-8 overflow-hidden rounded-2xl shadow-2xl bg-cream/10 p-6 backdrop-blur-sm"
          initial={{ y: 60, opacity: 0, rotateX: 20 }}
          animate={{ y: 0, opacity: 1, rotateX: 0 }}
          transition={{ ...springSmooth, delay: 0.5, duration: 1.5 }}
        >
          <img 
            src={graceLogo}
            alt="Grace Ministry Hub Logo"
            className="h-32 object-contain"
          />
        </motion.div>

        <div className="overflow-hidden">
          <motion.h1 
            className={`${typography.h1} text-cream max-w-4xl`}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...springSmooth, delay: 1.5, duration: 1.5 }}
          >
            Move from scattered <span className="text-gold italic">weekly work</span>
          </motion.h1>
        </div>

        <div className="overflow-hidden mt-6">
          <motion.p
            className={`${typography.bodyLg} text-cream/80 max-w-2xl`}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...springSmooth, delay: 2.5, duration: 1.5 }}
          >
            To beautifully prepared services and coordinated teams.
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}