
import LoginForm from '@/components/auth/LoginForm';
import { TavernLogo } from '@/components/TavernLogo';

export default function Login() {
  return (
    <div className="container min-h-screen bg-[#48495E] flex items-center justify-center flex-col">
      <div className="mb-8">
        <TavernLogo size="lg" />
      </div>
      <LoginForm />
    </div>
  );
}
