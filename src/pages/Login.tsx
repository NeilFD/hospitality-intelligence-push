
import { useEffect } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import { TavernLogo } from '@/components/TavernLogo';
import { motion } from 'framer-motion';

export default function Login() {
  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{ 
        backgroundImage: `url('/lovable-uploads/e9ebd5f6-e0c9-45f1-a0df-43f2572d84c8.png')`
      }}
    >
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-xl">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 100,
            damping: 15,
            delay: 0.2
          }}
          className="flex justify-center mb-8"
        >
          <TavernLogo size="3xl" className="filter drop-shadow-2xl" />
        </motion.div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ 
            duration: 0.7,
            delay: 0.5
          }}
        >
          <LoginForm />
        </motion.div>
      </div>
    </div>
  );
}
