'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check auth state and redirect accordingly
    const checkAndRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const target = session ? '/dashboard' : '/login';
      const timer = setTimeout(() => router.replace(target), 1800);
      return () => clearTimeout(timer);
    };
    checkAndRedirect();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-[var(--bg-base)] overflow-hidden">
      {/* Mesh Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--accent)] opacity-[0.06] blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--accent-cyan)] opacity-[0.05] blur-[120px]" />
        <div className="absolute top-[40%] right-[30%] w-[30%] h-[30%] rounded-full bg-[var(--accent-rose)] opacity-[0.04] blur-[90px]" />
      </div>
      
      {/* Grid overlay for texture */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] z-0" style={{ backgroundSize: '32px 32px' }}></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, filter: 'blur(12px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="text-center relative z-10 flex flex-col items-center"
      >
        {/* Floating Logo Container */}
        <motion.div
          animate={{ y: [-8, 8, -8] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="relative mb-10 w-32 h-32"
        >
          {/* Logo Glow Behind */}
          <motion.div
            animate={{ 
              scale: [1, 1.15, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-[32px] blur-3xl"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-cyan))' }}
          />
          
          {/* Logo Card */}
          <div 
            className="relative w-full h-full rounded-[32px] flex items-center justify-center border border-white/10 backdrop-blur-2xl shadow-2xl overflow-hidden"
            style={{ background: '#0a0a0a' }}
          >
            {/* Shimmer effect */}
            <motion.div 
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
            />
            <Image
              src="/logo of salesmind.png"
              alt="SalesMind AI"
              width={100}
              height={100}
              className="object-contain relative z-10"
            />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
          className="text-5xl md:text-7xl font-sans font-bold tracking-tight mb-5 text-white drop-shadow-sm"
        >
          SalesMind AI
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
          className="text-[var(--text-secondary)] text-lg md:text-xl mb-12 font-medium tracking-wide max-w-md mx-auto"
        >
          The intelligent copilot for modern sales teams.
        </motion.p>

        {/* Progress Loader */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="flex flex-col items-center justify-center gap-4 w-64"
        >
          <div className="w-full h-1.5 rounded-full overflow-hidden bg-white/5 border border-white/10 shadow-inner relative">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2.2, ease: [0.25, 1, 0.5, 1] }}
              className="absolute top-0 left-0 h-full rounded-full"
              style={{ 
                background: 'linear-gradient(90deg, var(--accent), var(--accent-cyan), var(--accent-rose))',
                backgroundSize: '200% 100%',
              }}
              animate-bg={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition-bg={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
            <p className="text-[var(--text-muted)] text-[11px] font-semibold tracking-widest uppercase">Initializing Workspace</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

