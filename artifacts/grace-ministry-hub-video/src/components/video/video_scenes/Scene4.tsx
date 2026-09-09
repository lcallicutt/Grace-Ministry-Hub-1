import { motion } from 'framer-motion';
import { typography, colors, sceneContainerClass, springSnappy, springSmooth } from '../system';

export function Scene4() {
  return (
    <motion.div
      key="scene4"
      className={sceneContainerClass}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ x: "-100%" }}
      transition={{ duration: 1 }}
    >
      <div className="absolute inset-0 flex">
        {/* Left Side - Image */}
        <motion.div 
          className="w-1/2 h-full relative overflow-hidden"
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.img
            src={`${import.meta.env.BASE_URL}images/volunteers.jpg`}
            className="w-full h-full object-cover"
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 12, ease: "linear" }}
          />
          <div className="absolute inset-0 bg-deepNavy/20" />
        </motion.div>
        
        {/* Right Side - Content */}
        <motion.div 
          className="w-1/2 h-full bg-cream relative flex flex-col justify-center px-16"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...springSnappy, delay: 1.5, duration: 1.5 }}
          >
            <h3 className={`${typography.accent} text-teal mb-4`}>Event & Volunteer Planning</h3>
            <h2 className={`${typography.h2} text-deepNavy mb-6`}>
              Coordinate teams seamlessly.
            </h2>
            <p className={`${typography.bodyLg} text-primaryNavy mb-12 max-w-lg`}>
              Schedule volunteers, plan events, and keep everyone aligned for Sunday.
            </p>
          </motion.div>

          {/* Staggered Schedule Cards */}
          <div className="space-y-4">
            {[
              { role: "Greeters", time: "9:00 AM", name: "Sarah M.", delay: 2.5 },
              { role: "Production", time: "8:30 AM", name: "David K.", delay: 3.5 },
              { role: "Kids Ministry", time: "9:15 AM", name: "Emma T.", delay: 4.5 }
            ].map((item, i) => (
              <motion.div
                key={item.role}
                className="bg-white p-4 rounded-lg shadow-sm border border-border flex items-center justify-between"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...springSmooth, delay: item.delay, duration: 1.5 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center text-teal text-sm font-bold">
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <h5 className="font-sans font-bold text-deepNavy">{item.role}</h5>
                    <p className="text-sm text-gray-500">{item.name}</p>
                  </div>
                </div>
                <div className="text-sm font-mono text-teal bg-teal/5 px-3 py-1 rounded-full">
                  {item.time}
                </div>
              </motion.div>
            ))}
          </div>

        </motion.div>
      </div>
    </motion.div>
  );
}