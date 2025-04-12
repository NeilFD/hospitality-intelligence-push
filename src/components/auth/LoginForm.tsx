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
      boxShadow: "0 0 0 2px rgba(211, 228, 253, 0.5)"
    }
  };
  return <div className="backdrop-blur-xl bg-white/25 border border-white/30 rounded-2xl p-8 shadow-xl">
      
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <motion.div className="bg-red-400/20 backdrop-blur-sm text-gray-800 p-4 rounded-xl text-sm border border-red-400/30" initial={{
        opacity: 0,
        y: -10
      }} animate={{
        opacity: 1,
        y: 0
      }}>
            {error}
          </motion.div>}
        
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-700">Email</Label>
          <motion.div whileHover="focus" whileFocus="focus">
            <motion.div variants={inputVariants}>
              <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-white/10 border-white/20 text-gray-800 placeholder:text-gray-500 focus:bg-white/15 transition-all duration-300" />
            </motion.div>
          </motion.div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-700">Password</Label>
          <motion.div whileHover="focus" whileFocus="focus">
            <motion.div variants={inputVariants}>
              <Input id="password" type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required className="bg-white/10 border-white/20 text-gray-800 placeholder:text-gray-500 focus:bg-white/15 transition-all duration-300" />
            </motion.div>
          </motion.div>
        </div>
        
        <motion.div whileHover={{
        scale: 1.03
      }} whileTap={{
        scale: 0.97
      }} className="pt-2 relative overflow-hidden group">
          <Button type="submit" disabled={isLoading} className="w-full transition-all duration-300 relative overflow-hidden text-hi-purple font-bold bg-green-300 hover:bg-green-200">
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </motion.div>
        
        <div className="flex items-center justify-center space-x-1 pt-2">
          <p className="text-center text-sm text-gray-600">
            Don't have an account?
          </p>
          <Button variant="link" className="p-0 text-green-600 hover:text-green-700" onClick={() => navigate('/register')}>
            Register
          </Button>
        </div>
      </form>
    </div>;
}