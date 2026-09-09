import { motion } from 'framer-motion';

export const springSnappy = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
};

export const springBouncy = {
  type: 'spring',
  stiffness: 300,
  damping: 15,
};

export const springSmooth = {
  type: 'spring',
  stiffness: 120,
  damping: 25,
};

export const easeOutSnappy = [0.16, 1, 0.3, 1];
export const easeOutSmooth = [0.25, 1, 0.5, 1];

export const typography = {
  h1: "font-serif text-6xl leading-[1.1] tracking-tight",
  h2: "font-serif text-5xl leading-[1.1] tracking-tight",
  h3: "font-serif text-4xl leading-[1.2] tracking-tight",
  bodyLg: "font-sans text-2xl leading-relaxed tracking-wide text-foreground/80",
  bodyMd: "font-sans text-xl leading-relaxed tracking-wide text-foreground/80",
  accent: "font-sans font-bold text-lg tracking-[0.1em] uppercase",
};

export const colors = {
  cream: '#FAF9F5',
  deepNavy: '#102F56',
  primaryNavy: '#114574',
  teal: '#197780',
  gold: '#E6B738',
};

// Base layout classes that apply to all scenes
export const sceneContainerClass = "absolute inset-0 w-full h-full overflow-hidden flex flex-col justify-center bg-cream";

export const SceneBackground = ({ 
  type = 'color', 
  color = colors.cream,
  videoSrc,
  imageSrc,
  opacity = 1
}: { 
  type?: 'color' | 'video' | 'image';
  color?: string;
  videoSrc?: string;
  imageSrc?: string;
  opacity?: number;
}) => (
  <div 
    className="absolute inset-0 w-full h-full z-0 pointer-events-none"
    style={{ backgroundColor: type === 'color' ? color : 'transparent' }}
  >
    {type === 'video' && videoSrc && (
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity }}
        src={videoSrc}
      />
    )}
    {type === 'image' && imageSrc && (
      <img
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity }}
        src={imageSrc}
      />
    )}
    {/* Noise Overlay */}
    <div 
      className="absolute inset-0 w-full h-full opacity-[0.03] mix-blend-multiply"
      style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/texture-noise.png)`, backgroundRepeat: 'repeat' }}
    />
  </div>
);