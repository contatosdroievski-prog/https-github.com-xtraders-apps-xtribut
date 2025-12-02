import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';

interface TermsModalProps {
  onAccept: () => void;
}

export function TermsModal({ onAccept }: TermsModalProps) {
  const [accepting, setAccepting] = useState(false);

  const handleAccept = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setAccepting(true);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(
        userDocRef,
        {
          email: currentUser.email,
          termsAccepted: {
            version: '1.0',
            timestamp: new Date(),
          },
        },
        { merge: true }
      );
      onAccept();
    } catch (error) {
      alert('Ocorreu um erro ao salvar sua confirmação. Tente novamente.');
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-[2500] p-4">
      <div className="glass-card p-8 max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="bg-[#0D0D0D] border border-border p-6 rounded-lg mb-6 max-h-[55vh] overflow-y-auto">
          <h4 className="text-center text-accent mb-6">
            {'>> Termos Legais, Condições e Avisos <<'}
          </h4>
          <p className="mb-4">
            Ao utilizar as planilhas, ferramentas, e ao fazer uso das informações contidas no
            projeto IR, o usuário confirma que leu, entendeu e aceitou os termos, condições e
            avisos aqui listados.
          </p>
          <p className="mb-4">
            <strong>17 -</strong> Qualquer cliente que esteja tendo dificuldades com a apuração nas
            planilhas, ferramentas e informações contidas no Projeto IR poderá solicitar auxílio da
            equipe responsável, que providenciará a resposta adequada, se possível, com a maior
            brevidade possível dentro do razoável. Caso o cliente, mesmo após a ajuda, não consiga
            apurar seu imposto corretamente.
          </p>
          <p className="mb-4 text-sm opacity-70">
            Este é um resumo dos termos. Os termos completos estão disponíveis em nosso site.
          </p>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            variant="destructive"
            onClick={() => signOut(auth)}
            disabled={accepting}
          >
            Recusar e Sair
          </Button>
          <Button
            onClick={handleAccept}
            disabled={accepting}
            className="bg-gradient-to-r from-[#D4AF37] via-[#FFEE99] to-[#D4AF37] bg-[length:150%_auto] text-[#0D0D0D] hover:bg-[length:250%_auto] transition-all duration-500"
          >
            {accepting ? 'Salvando...' : 'Li, entendi e aceito os termos'}
          </Button>
        </div>
      </div>
    </div>
  );
}
