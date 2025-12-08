
import React, { useState } from 'react';
import { ArrowRight, CheckCircle, TrendingUp, Shield, BookOpen, Calculator, DollarSign, Globe } from 'lucide-react';
import { LogoHeader } from './Logo';
import { Carousel3D } from './Carousel3D';
import { Lightbox } from './Lightbox';
import { RDStationForm } from './RDStationForm';

import printCambial from '../assets/print_cambial.png';
import printCalendario from '../assets/print_calendario.png';
import printApuracao from '../assets/print_apuracao.png';
import printOperacoes from '../assets/print_operacoes.png';
import printHistorico from '../assets/print_historico.png';

interface LandingPageProps {
    onLogin: () => void;
    onRegister: () => void;
}

const showcaseImages = [
    {
        src: printCambial,
        alt: "Relatório Cambial",
        title: "Controle Cambial",
        description: "Acompanhe seus envios e retiradas com precisão."
    },
    {
        src: printCalendario,
        alt: "Calendário de Resultados",
        title: "Calendário Anual",
        description: "Visualização clara dos seus resultados mês a mês."
    },
    {
        src: printApuracao,
        alt: "Apuração de Resultados",
        title: "Apuração Automática",
        description: "Cálculo exato do imposto devido em segundos."
    },
    {
        src: printOperacoes,
        alt: "Detalhamento de Operações",
        title: "Detalhamento Completo",
        description: "Visualize cada operação e seu impacto no resultado."
    },
    {
        src: printHistorico,
        alt: "Histórico Anual",
        title: "Histórico Detalhado",
        description: "Todo o seu histórico de operações em um só lugar."
    }
];

export function LandingPage({ onLogin, onRegister }: LandingPageProps) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-amber-500/30">
            {/* Header/Nav */}
            <header className="fixed top-0 w-full z-50 bg-zinc-950/80 backdrop-blur-md border-b border-white/5">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 scale-90 origin-left">
                        <LogoHeader />
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onLogin}
                            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                        >
                            Login
                        </button>
                        <button
                            onClick={onRegister}
                            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-full text-sm transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                        >
                            Começar Agora
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/10 via-zinc-950 to-zinc-950" />
                <div className="container mx-auto px-6 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                        <div className="flex-1 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold uppercase tracking-wider mb-6">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                Nova Legislação 2024
                            </div>
                            <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
                                Domine a Tributação de <br />
                                <span className="text-amber-500">
                                    Day Trade Internacional
                                </span>
                            </h1>
                            <p className="text-lg text-zinc-400 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                Aprenda a declarar e pagar seus impostos de CFD e Forex corretamente.
                                Evite multas pesadas da Receita Federal e automatize seus cálculos com nossa plataforma exclusiva.
                            </p>


                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                                <RDStationForm />
                            </div>

                            <div className="mt-12 flex items-center justify-center lg:justify-start gap-8 text-zinc-500 text-sm">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-amber-500" />
                                    <span>Atualizado 2024</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-amber-500" />
                                    <span>Cálculo Automático</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-amber-500" />
                                    <span>Suporte Especializado</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 relative w-full max-w-lg lg:max-w-none">
                            <div className="relative z-10 rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-xl shadow-2xl overflow-hidden aspect-[16/10] group">
                                <img
                                    src={printHistorico}
                                    alt="Dashboard Preview"
                                    className="w-full h-full object-cover"
                                />

                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
                            </div>

                            {/* Decorative Elements */}
                            <div className="absolute -top-10 -right-10 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px]" />
                            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-cyan-500/5 rounded-full blur-[100px]" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-teal-500/5 rounded-full blur-[100px] -z-10" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Vantagens Section */}
            <section id="vantagens" className="py-24 bg-zinc-950 relative">
                <div className="container mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl lg:text-4xl font-bold mb-6">Por que você precisa deste curso?</h2>
                        <p className="text-zinc-400">
                            O mercado internacional oferece grandes oportunidades, mas a burocracia tributária pode transformar seus lucros em prejuízos se não for gerenciada corretamente.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <AdvantageCard
                            icon={<Shield className="w-8 h-8 text-amber-500" />}
                            title="Evite a Malha Fina"
                            description="A Receita Federal aplica multas pesadas para quem não declara corretamente. Não corra o risco de perder seus lucros para juros e multas."
                        />
                        <AdvantageCard
                            icon={<TrendingUp className="w-8 h-8 text-cyan-500" />}
                            title="Foco no Trading"
                            description="Deixe a parte chata e burocrática conosco. Nosso sistema automatiza os cálculos para que você foque apenas em operar."
                        />
                        <AdvantageCard
                            icon={<DollarSign className="w-8 h-8 text-emerald-500" />}
                            title="Economia Real"
                            description="Contadores especializados cobram caro. Nosso curso + sistema custa uma fração do valor e te dá autonomia total."
                        />
                        <AdvantageCard
                            icon={<BookOpen className="w-8 h-8 text-purple-500" />}
                            title="Didática Simples"
                            description="Aulas curtas de 10 a 15 minutos, direto ao ponto. Sem 'economês' ou enrolação. Aprenda o que realmente importa."
                        />
                        <AdvantageCard
                            icon={<Globe className="w-8 h-8 text-blue-500" />}
                            title="Nova Legislação 2024"
                            description="Tudo sobre as novas regras que entraram em vigor em Janeiro de 2024. O que mudou e como isso afeta seus investimentos."
                        />
                        <AdvantageCard
                            icon={<Calculator className="w-8 h-8 text-rose-500" />}
                            title="Calculadora Automática"
                            description="Importe seus relatórios da corretora e obtenha o valor exato do imposto a pagar em segundos. Simples assim."
                        />
                    </div>
                </div>
            </section>

            {/* App Showcase / Gallery Section */}
            <section className="py-24 bg-zinc-900/30 border-y border-white/5 overflow-hidden">
                <div className="container mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16 relative z-10">
                        <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                            Conheça a Plataforma <span className="text-amber-500">Por Dentro</span>
                        </h2>
                        <p className="text-zinc-400">
                            Interface intuitiva, relatórios detalhados e tudo o que você precisa para estar em dia com a Receita.
                        </p>
                    </div>

                    <div className="relative z-10">
                        <Carousel3D
                            images={showcaseImages}
                            onImageClick={(index) => setLightboxIndex(index)}
                        />
                    </div>

                    {lightboxIndex !== null && (
                        <Lightbox
                            isOpen={true}
                            onClose={() => setLightboxIndex(null)}
                            imageSrc={showcaseImages[lightboxIndex].src}
                            imageAlt={showcaseImages[lightboxIndex].alt}
                        />
                    )}

                    {/* Decorative Petrol Blue Blurs */}
                    <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-cyan-900/20 rounded-full blur-[128px] -translate-y-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-900/20 rounded-full blur-[128px] pointer-events-none" />
                </div>
            </section>

            {/* Course Details Section */}
            <section className="py-24 bg-zinc-950">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="flex-1 space-y-8">
                            <h2 className="text-3xl lg:text-4xl font-bold">
                                Sistema de Cálculo <span className="text-amber-500">Automático</span>
                            </h2>
                            <p className="text-zinc-400 text-lg leading-relaxed">
                                Esqueça as planilhas complexas e a dor de cabeça de calcular variações cambiais manualmente.
                                Nosso sistema exclusivo processa seus relatórios e entrega tudo pronto.
                            </p>

                            <ul className="space-y-4">
                                <ListItem text="Importação direta de relatórios da corretora" />
                                <ListItem text="Cálculo automático de lucro/prejuízo em reais" />
                                <ListItem text="Ajuste de variação cambial e repatriação" />
                                <ListItem text="Geração de DARF e instruções para declaração" />
                            </ul>

                            <div className="pt-4">
                                <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                    <h4 className="font-bold text-amber-500 mb-2">Parceria Zero Markets</h4>
                                    <p className="text-sm text-zinc-400">
                                        Nossos relatórios são otimizados para a Zero Markets, garantindo precisão máxima nos cálculos.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 w-full">
                            <div className="relative rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl overflow-hidden aspect-video group">
                                <img src={printApuracao} alt="Calculator Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-transparent" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 to-amber-950/20" />
                <div className="container mx-auto px-6 relative z-10 text-center">
                    <h2 className="text-4xl lg:text-5xl font-bold mb-8">
                        Comece a Operar com <br />
                        <span className="text-amber-500">Tranquilidade Fiscal</span>
                    </h2>
                    <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto">
                        Não deixe para a última hora. Regularize sua situação hoje mesmo e evite problemas com a Receita Federal.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <button
                            onClick={onRegister}
                            className="w-full sm:w-auto px-10 py-5 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-lg font-bold rounded-xl transition-all hover:scale-105 shadow-[0_0_40px_rgba(245,158,11,0.3)]"
                        >
                            Quero Acesso ao Sistema
                        </button>
                    </div>
                    <p className="mt-8 text-sm text-zinc-500">
                        Acesso imediato após a confirmação do pagamento.
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-white/5 bg-zinc-950">
                <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2 scale-75 origin-left">
                        <LogoHeader />
                    </div>
                    <p className="text-zinc-600 text-sm">
                        © 2024 MDT XTraders. Todos os direitos reservados.
                    </p>
                </div>
            </footer>
        </div>
    );
}

function AdvantageCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="p-8 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-amber-500/30 transition-all hover:-translate-y-1 group">
            <div className="mb-6 p-4 rounded-xl bg-zinc-950 border border-white/5 w-fit group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-4 text-zinc-100 group-hover:text-amber-500 transition-colors">{title}</h3>
            <p className="text-zinc-400 leading-relaxed">
                {description}
            </p>
        </div>
    );
}

function ListItem({ text }: { text: string }) {
    return (
        <li className="flex items-start gap-3">
            <div className="mt-1 min-w-5 min-h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
            </div>
            <span className="text-zinc-300">{text}</span>
        </li>
    );
}

