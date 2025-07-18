import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { User, LoginData } from "@shared/schema";

let authState = {
  user: null as User | null,
  isLoading: true,
  isAuthenticated: false,
  hasChecked: false
};

let listeners: ((state: typeof authState) => void)[] = [];

const notifyListeners = () => {
  listeners.forEach(listener => listener(authState));
};

const setAuthState = (newState: Partial<typeof authState>) => {
  authState = { ...authState, ...newState };
  notifyListeners();
};

// Check authentication once on app load
if (!authState.hasChecked) {
  const token = localStorage.getItem('authToken');
  const headers: Record<string, string> = { 'credentials': 'include' };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  fetch("/api/auth/me", { 
    credentials: 'include',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  })
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      return null;
    })
    .then(userData => {
      setAuthState({
        user: userData,
        isAuthenticated: !!userData,
        isLoading: false,
        hasChecked: true
      });
    })
    .catch(() => {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        hasChecked: true
      });
    });
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [localState, setLocalState] = useState(authState);

  useEffect(() => {
    const listener = (newState: typeof authState) => {
      setLocalState(newState);
    };
    
    listeners.push(listener);
    
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao fazer login");
      }

      return response.json();
    },
    onSuccess: async (data) => {
      // Store JWT token if provided
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
      
      // Set user data from login response
      if (data.user) {
        setAuthState({
          user: data.user,
          isAuthenticated: true,
          isLoading: false
        });
      }
      
      queryClient.invalidateQueries();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao fazer logout");
      }

      return response.json();
    },
    onSuccess: () => {
      // Clear JWT token
      localStorage.removeItem('authToken');
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
      queryClient.clear();
      // Força recarregamento da página para limpar qualquer cache residual
      window.location.reload();
    },
  });

  return {
    user: localState.user,
    isLoading: localState.isLoading,
    error: null,
    isAuthenticated: localState.isAuthenticated,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error,
  };
}