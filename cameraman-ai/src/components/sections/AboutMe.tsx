import { motion } from "framer-motion";
import { Camera, Heart, Coffee, Instagram } from "lucide-react";

export function AboutMe() {
  return (
    <div className="h-[calc(100vh-12rem)] flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full bg-card rounded-3xl border border-border shadow-2xl p-10 text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-48 bg-primary/10 rounded-[100%] blur-3xl -z-10" />

        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary to-amber-300 rounded-full blur-lg opacity-40 scale-110" />
          <div className="w-36 h-36 rounded-full border-4 border-primary/60 bg-gradient-to-br from-primary/20 to-amber-600/10 flex items-center justify-center relative z-10 shadow-xl shadow-primary/20">
            <Camera className="w-16 h-16 text-primary" strokeWidth={1.5} />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-card p-2 rounded-full border border-border z-20 shadow-lg">
            <Instagram className="w-5 h-5 text-primary" />
          </div>
        </div>

        <a
          href="https://www.instagram.com/arya_the_camerman"
          target="_blank"
          rel="noopener noreferrer"
          className="text-3xl font-display font-bold text-foreground mb-2 hover:text-primary transition-colors inline-flex items-center gap-2 block"
        >
          @arya_the_camerman
        </a>
        
        <div className="w-12 h-1 bg-primary/50 mx-auto rounded-full mb-6 mt-2" />

        <p className="text-lg text-muted-foreground leading-relaxed mb-8">
          Hope you enjoy my free study website! I built this using AI to help students learn faster without worrying about subscriptions or limits.
        </p>

        <div className="flex items-center justify-center gap-6 text-sm font-medium text-muted-foreground">
          <div className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-full">
            <Heart className="w-4 h-4 text-red-400 fill-red-400/20" /> 100% Free
          </div>
          <div className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-full">
            <Coffee className="w-4 h-4 text-amber-600" /> No Sign-up
          </div>
        </div>
      </motion.div>
    </div>
  );
}
