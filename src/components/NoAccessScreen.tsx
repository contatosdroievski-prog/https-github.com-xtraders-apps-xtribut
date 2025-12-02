import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Logo } from './Logo';
import { Button } from './ui/button';

export function NoAccessScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1A1A1A] to-[#0D0D0D] p-4">
      <div className="w-full max-w-[700px] glass-card p-8 md:p-12 animate-fade-in-up text-center">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        <h2 className="mb-3">Acesso Negado</h2>
        <p className="text-muted mb-8">
          Não encontramos um pagamento ativo para esta conta. Por favor, verifique o status da sua
          compra ou entre em contato com o suporte.
        </p>

        <Button
          onClick={() => signOut(auth)}
          variant="destructive"
          className="w-full"
        >
          Sair
        </Button>
      </div>
    </div>
  );
}
