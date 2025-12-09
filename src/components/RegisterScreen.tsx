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
        <div className="mx-auto mb-8 flex justify-center">
          <svg className="w-14 h-auto flex-shrink-0" viewBox="0 0 59.7 45.9" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="logo-gradient-register" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#D4AF37" />
                <stop offset="50%" stopColor="#FFEE99" />
                <stop offset="100%" stopColor="#D4AF37" />
              </linearGradient>
            </defs>
            <path fill="url(#logo-gradient-register)" d="M4.76369 -0.719727C2.13278 -0.719727 0 1.41305 0 4.04396V4.04396C0.00217239 3.70526 0.105853 3.37498 0.297665 3.09573C0.489477 2.81649 0.760619 2.60109 1.07611 2.47733C1.3916 2.35357 1.73695 2.32713 2.06762 2.40142C2.39829 2.47571 2.6991 2.64732 2.93124 2.89411L12.335 12.8644C13.2797 13.866 14.5956 14.4337 15.9724 14.4337H25.321C25.7157 14.4314 26.1025 14.5448 26.4334 14.7599C26.7644 14.975 27.0249 15.2823 27.1829 15.6438C27.3409 16.0054 27.3894 16.4053 27.3224 16.794C27.2553 17.1828 27.0757 17.5434 26.8058 17.8313L2.93398 43.2184C2.70202 43.4662 2.40099 43.6387 2.06985 43.7135C1.7387 43.7884 1.3927 43.7622 1.07662 43.6383C0.760551 43.5144 0.488961 43.2986 0.297012 43.0187C0.105064 42.7389 0.00159475 42.4079 0 42.0686V42.0686C0 44.6587 2.09968 46.7584 4.68977 46.7584H55.1698C57.9313 46.7584 60.1698 44.5198 60.1698 41.7584V4.28028C60.1698 1.51886 57.9313 -0.719727 55.1698 -0.719727H4.76369ZM18.297 1.59641C18.1396 1.42755 18.0354 1.2162 17.9972 0.988633C17.9591 0.761063 17.9887 0.527307 18.0824 0.316417C18.1761 0.105528 18.3297 -0.073197 18.5242 -0.197543C18.7187 -0.321889 18.9455 -0.386374 19.1763 -0.382983H40.9415C41.1711 -0.38424 41.3961 -0.318396 41.5888 -0.193551C41.7814 -0.0687055 41.9334 0.109697 42.026 0.319715C42.1185 0.529733 42.1476 0.762208 42.1097 0.988546C42.0718 1.21488 41.9686 1.42522 41.8126 1.59367L32.5669 11.5153C32.2486 11.8553 31.8638 12.1264 31.4364 12.3117C31.009 12.497 30.5481 12.5926 30.0822 12.5926C29.6163 12.5926 29.1553 12.497 28.7279 12.3117C28.3005 12.1264 27.9158 11.8553 27.5975 11.5153L18.297 1.59641ZM40.9196 46.501C40.9196 46.498 40.9171 46.4955 40.914 46.4955H19.1544C18.9243 46.4973 18.6986 46.4316 18.5054 46.3066C18.3122 46.1817 18.1598 46.0029 18.0671 45.7923C17.9745 45.5817 17.9455 45.3487 17.984 45.1219C18.0224 44.8951 18.1264 44.6845 18.2833 44.5161L27.5208 34.5973C27.8391 34.2572 28.2238 33.9862 28.6512 33.8008C29.0786 33.6155 29.5396 33.5199 30.0055 33.5199C30.4714 33.5199 30.9323 33.6155 31.3597 33.8008C31.7871 33.9862 32.1719 34.2572 32.4902 34.5973L41.788 44.5216C41.9465 44.6896 42.052 44.9004 42.0916 45.1279C42.1311 45.3553 42.1028 45.5894 42.0103 45.8009C41.9177 46.0125 41.765 46.1921 41.5711 46.3176C41.3786 46.442 41.1541 46.5077 40.925 46.5065C40.922 46.5065 40.9196 46.5041 40.9196 46.501V46.501ZM60.0959 42.0686C60.0937 42.4073 59.99 42.7376 59.7982 43.0168C59.6064 43.2961 59.3353 43.5115 59.0198 43.6352C58.7043 43.759 58.3589 43.7854 58.0283 43.7111C57.6976 43.6368 57.3968 43.4652 57.1646 43.2184L47.7636 33.2486C46.8189 32.2467 45.5029 31.6788 44.1259 31.6788H34.7776C34.3827 31.6809 33.9957 31.5673 33.6646 31.3521C33.3335 31.1369 33.0727 30.8294 32.9145 30.4678C32.7563 30.1061 32.7075 29.706 32.7743 29.3169C32.841 28.9279 33.0204 28.5669 33.2901 28.2785L57.1537 2.90506C57.3851 2.65704 57.6857 2.48423 58.0166 2.40904C58.3475 2.33386 58.6933 2.35977 59.0093 2.48342C59.3252 2.60707 59.5967 2.82274 59.7885 3.10247C59.9803 3.3822 60.0836 3.71307 60.0849 4.05217L60.0959 42.0686Z" />
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
