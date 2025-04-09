
import { useEffect } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import { TavernLogo } from '@/components/TavernLogo';
import { motion } from 'framer-motion';

export default function Login() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#48495E] via-[#38394E] to-[#2C2D3E] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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
