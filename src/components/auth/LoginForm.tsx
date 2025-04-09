import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/services/auth-service';
export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const {
    login,
    isLoading,
    error,
    clearError
  } = useAuthStore();
  const navigate = useNavigate();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      // Error is handled by the login function
    }
  };
  const inputVariants = {
    focus: {
      scale: 1.02,
      boxShadow: "0 0 0 2px rgba(165, 192, 226, 0.5)"
    }
  };
  return <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-xl">
      <motion.h1 className="text-3xl font-bold text-white text-center mb-6" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} transition={{
      delay: 0.3
    }}>The Tavern</motion.h1>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <motion.div className="bg-red-400/20 backdrop-blur-sm text-white p-4 rounded-xl text-sm border border-red-400/30" initial={{
        opacity: 0,
        y: -10
      }} animate={{
        opacity: 1,
        y: 0
      }}>
            {error}
          </motion.div>}
        
        <div className="space-y-2">
          <Label htmlFor="email" className="text-white/90">Email</Label>
          <motion.div whileHover="focus" whileFocus="focus">
            <motion.div variants={inputVariants}>
              <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:bg-white/10 transition-all duration-300" />
            </motion.div>
          </motion.div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password" className="text-white/90">Password</Label>
          <motion.div whileHover="focus" whileFocus="focus">
            <motion.div variants={inputVariants}>
              <Input id="password" type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required className="bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:bg-white/10 transition-all duration-300" />
            </motion.div>
          </motion.div>
        </div>
        
        <motion.div whileHover={{
        scale: 1.03
      }} whileTap={{
        scale: 0.97
      }} className="pt-2 relative overflow-hidden group">
          <Button type="submit" className="w-full bg-gradient-to-r from-tavern-green/90 to-tavern-blue-light/90 text-white hover:from-tavern-green hover:to-tavern-blue-light hover:shadow-lg transition-all duration-300 relative overflow-hidden" disabled={isLoading}>
            <span className="absolute inset-x-0 top-0 h-0.5 bg-white/30 animate-shimmer" />
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </motion.div>
        
        <div className="flex items-center justify-center space-x-1 pt-2">
          <p className="text-center text-sm text-white/70">
            Don't have an account?
          </p>
          <Button variant="link" className="p-0 text-tavern-green-light hover:text-white" onClick={() => navigate('/register')}>
            Register
          </Button>
        </div>
      </form>
    </div>;
}