import { motion } from 'framer-motion';
import { typography, colors, sceneContainerClass, springSnappy, springSmooth } from '../system';

export function Scene3() {
  return (
    <motion.div
      key="scene3"
      className={sceneContainerClass}
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-0 bg-primaryNavy" />
      
      {/* Background Video */}
      <motion.div className="absolute inset-0 opacity-40 mix-blend-overlay">
        <video 
          src={`${import.meta.env.BASE_URL}videos/abstract-wave.mp4`}
          autoPlay 
          loop 
          muted 
          className="w-full h-full object-cover"
        />
      </motion.div>

      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center px-16">
        
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...springSnappy, delay: 1.0, duration: 1.5 }}
          className="mb-12"
        >
          <h3 className={`${typography.accent} text-gold mb-6`}>Weekly Service Builder</h3>
          <h2 className={`${typography.h1} text-cream max-w-5xl leading-tight`}>
            One input.<br/>
            <span className="text-teal italic">Three outputs.</span>
          </h2>
        </motion.div>

        <div className="flex gap-8 mt-8">
          {[
            { title: "Bulletin", delay: 2.5 },
            { title: "Projection", delay: 3.5 },
            { title: "Announcer", delay: 4.5 }
          ].map((item, i) => (
            <motion.div
              key={item.title}
              className="bg-cream/10 backdrop-blur-md border border-cream/20 rounded-xl p-8 w-64 flex flex-col items-center"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ ...springSmooth, delay: item.delay, duration: 1.5 }}
            >
              <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mb-4">
                 <div className="w-8 h-8 bg-gold rounded-sm" />
              </div>
              <h4 className="font-serif text-2xl text-cream">{item.title}</h4>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}