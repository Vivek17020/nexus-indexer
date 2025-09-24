import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { generateWallet, storeWalletSecurely, hasStoredWallet } from '@/lib/wallet';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true
  });

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          loading: false
        }));

        // Generate wallet on first signup
        if (event === 'SIGNED_IN' && session?.user && !hasStoredWallet()) {
          setTimeout(() => {
            const wallet = generateWallet();
            storeWalletSecurely(wallet);
            
            // Update user profile with wallet address
            supabase
              .from('profiles')
              .update({ wallet_address: wallet.address })
              .eq('user_id', session.user.id);
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        loading: false
      }));
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email?: string, phone?: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    if (email) {
      const { error } = await supabase.auth.signUp({
        email,
        password: generateRandomPassword(),
        options: {
          emailRedirectTo: redirectUrl,
          data: { display_name: displayName }
        }
      });
      return { error };
    } else {
      // Anonymous signup - create a temporary account
      const tempEmail = `anon_${Date.now()}@zkpresence.temp`;
      const { error } = await supabase.auth.signUp({
        email: tempEmail,
        password: generateRandomPassword(),
        options: {
          data: { 
            display_name: displayName || 'Anonymous User',
            is_anonymous: true 
          }
        }
      });
      return { error };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    ...authState,
    signUp,
    signOut
  };
};

const generateRandomPassword = (): string => {
  return Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
};