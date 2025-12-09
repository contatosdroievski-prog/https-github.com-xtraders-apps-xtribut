import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Eye, EyeOff } from 'lucide-react';

interface RegisterScreenProps {
  onSwitchToLogin: () => void;
}

export function RegisterScreen({ onSwitchToLogin }: RegisterScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');

  const handleRegistration = async () => {
    if (password !== confirmPassword) {
      setMessage('As senhas não coincidem.');
      setMessageType('error');
      return;
    }

    if (password.length < 6) {
      setMessage('A senha deve ter pelo menos 6 caracteres.');
      setMessageType('error');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: userCredential.user.email,
        termsAccepted: false,
        createdAt: new Date().toISOString()
      });
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setMessage('Este e-mail já está em uso.');
      } else {
        setMessage('Erro ao criar conta.');
      }
      setMessageType('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1A1A1A] to-[#0D0D0D] p-4">
      <div className="login-box">
        <div className="mx-auto mb-8">
          <svg className="w-20 h-auto inline-block" viewBox="0 0 60 46.4" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#D4AF37" />
                <stop offset="50%" stopColor="#FFEE99" />
                <stop offset="100%" stopColor="#D4AF37" />
              </linearGradient>
            </defs>
            <path className="logo-path" d="M4.76369 -0.719727C2.13278 -0.719727 0 1.41305 0 4.04396V4.04396C0.00217239 3.70526 0.105853 3.37498 0.297665 3.09573C0.489477 2.81649 0.760619 2.60109 1.07611 2.47733C1.3916 2.35357 1.73695 2.32713 2.06762 2.40142C2.39829 2.47571 2.6991 2.64732 2.93124 2.89411L12.335 12.8644C13.2797 13.866 14.5956 14.4337 15.9724 14.4337H25.321C25.7157 14.4314 26.1025 14.5448 26.4334 14.7599C26.7644 14.975 27.0249 15.2823 27.1829 15.6438C27.3409 16.0054 27.3894 16.4053 27.3224 16.794C27.2553 17.1828 27.0757 17.5434 26.8058 17.8313L2.93398 43.2184C2.70202 43.4662 2.40099 43.6387 2.06985 43.7135C1.7387 43.7884 1.3927 43.7622 1.07662 43.6383C0.760551 43.5144 0.488961 43.2986 0.297012 43.0187C0.105064 42.7389 0.00159475 42.4079 0 42.0686V42.0686C0 44.6587 2.09968 46.7584 4.68977 46.7584H55.1698C57.9313 46.7584 60.1698 44.5198 60.1698 41.7584V4.28028C60.1698 1.51886 57.9313 -0.719727 55.1698 -0.719727H4.76369ZM18.297 1.59641C18.1396 1.42755 18.0354 1.2162 17.9972 0.988633C17.9591 0.761063 17.9887 0.527307 18.0824 0.316417C18.1761 0.105528 18.3297 -0.073197 18.5242 -0.197543C18.7187 -0.321889 18.9455 -0.386374 19.1763 -0.382983H40.9415C41.1711 -0.38424 41.3961 -0.318396 41.5888 -0.193551C41.7814 -0.0687055 41.9334 0.109697 42.026 0.319715C42.1185 0.529733 42.1476 0.762208 42.1097 0.988546C42.0718 1.21488 41.9686 1.42522 41.8126 1.59367L32.5669 11.5153C32.2486 11.8553 31.8638 12.1264 31.4364 12.3117C31.009 12.497 30.5481 12.5926 30.0822 12.5926C29.6163 12.5926 29.1553 12.497 28.7279 12.3117C28.3005 12.1264 27.9158 11.8553 27.5975 11.5153L18.297 1.59641Z" />
          </svg>
        </div>

        <h1 className="text-3xl font-semibold mb-3 text-text-primary">Criar Nova Conta</h1>
        <p className="text-base text-text-secondary mb-8">Use o mesmo e-mail que você utilizou na compra.</p>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
          />
          <div className="password-container">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Crie uma senha (mín. 6 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="password-toggle"
              aria-label="Mostrar ou ocultar senha"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          <div className="password-container">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirme sua senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="password-toggle"
              aria-label="Mostrar ou ocultar senha"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <button
          onClick={handleRegistration}
          className="mt-6 btn btn-primary w-full text-base py-3"
        >
          <span>Cadastrar e Acessar</span>
        </button>

        <div className="mt-6 text-sm">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onSwitchToLogin();
            }}
            className="font-semibold text-accent-primary hover:text-accent-hover transition-colors duration-200"
          >
            Já tem uma conta? Acesse aqui.
          </a>
        </div>

        {message && (
          <p className={`message ${messageType}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
