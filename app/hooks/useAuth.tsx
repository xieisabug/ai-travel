import { useState, useCallback, useEffect, createContext, useContext } from 'react';
import type {
    CurrentUser,
    LoginRequest,
    RegisterRequest,
    LoginResponse,
    RegisterResponse,
} from '~/types/user';
import { authApi, setGlobalUnauthorizedHandler, setGlobalForbiddenHandler, ApiError } from '~/lib/api';

// ============================================
// 认证状态类型
// ============================================

interface AuthState {
    user: CurrentUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    error: string | null;
}

interface AuthContextValue extends AuthState {
    login: (data: LoginRequest) => Promise<LoginResponse | null>;
    register: (data: RegisterRequest) => Promise<boolean>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    clearError: () => void;
}

const initialState: AuthState = {
    user: null,
    isLoading: true, // 初始为 true，因为需要检查登录状态
    isAuthenticated: false,
    error: null,
};

// ============================================
// 认证 Hook
// ============================================

export function useAuth(): AuthContextValue {
    const [state, setState] = useState<AuthState>(initialState);

    // 清除错误
    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    // 刷新用户信息
    const refreshUser = useCallback(async () => {
        try {
            const data = await authApi.me() as { success: boolean; user?: CurrentUser };

            if (data.success && data.user) {
                setState({
                    user: data.user,
                    isLoading: false,
                    isAuthenticated: true,
                    error: null,
                });
                return;
            }

            // 未登录
            setState({
                user: null,
                isLoading: false,
                isAuthenticated: false,
                error: null,
            });
        } catch (error) {
            // 未登录或获取失败
            setState({
                user: null,
                isLoading: false,
                isAuthenticated: false,
                error: null,
            });
        }
    }, []);

    // 登录
    const login = useCallback(async (data: LoginRequest): Promise<LoginResponse | null> => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const result = await authApi.login(data) as LoginResponse;

            if (result.success && result.user) {
                setState({
                    user: result.user,
                    isLoading: false,
                    isAuthenticated: true,
                    error: null,
                });
                return result; // 返回完整的登录响应，包含每日奖励信息
            } else {
                setState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: result.error || '登录失败',
                }));
                return null;
            }
        } catch (error) {
            console.error('登录失败:', error);
            const errorMessage = error instanceof ApiError ? error.message : '登录失败';
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));
            return null;
        }
    }, []);

    // 注册
    const register = useCallback(async (data: RegisterRequest): Promise<boolean> => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const result = await authApi.register(data) as RegisterResponse;

            if (result.success && result.user) {
                setState({
                    user: result.user,
                    isLoading: false,
                    isAuthenticated: true,
                    error: null,
                });
                return true;
            } else {
                setState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: result.error || '注册失败',
                }));
                return false;
            }
        } catch (error) {
            console.error('注册失败:', error);
            const errorMessage = error instanceof ApiError ? error.message : '注册失败';
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));
            return false;
        }
    }, []);

    // 登出
    const logout = useCallback(async () => {
        try {
            await authApi.logout();
        } catch (error) {
            console.error('登出请求失败:', error);
        }

        setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            error: null,
        });
    }, []);

    // 初始化时检查登录状态
    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    return {
        ...state,
        login,
        register,
        logout,
        refreshUser,
        clearError,
    };
}

// ============================================
// 认证 Context（可选，用于全局状态）
// ============================================

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const auth = useAuth();

    return (
        <AuthContext.Provider value={auth}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
}

// ============================================
// 权限检查辅助函数
// ============================================

export function canGenerateWorld(user: CurrentUser | null): boolean {
    return user?.permissions.canGenerateWorld ?? false;
}

export function canDeleteWorld(user: CurrentUser | null): boolean {
    return user?.permissions.canDeleteWorld ?? false;
}

export function canAccessAdmin(user: CurrentUser | null): boolean {
    return user?.permissions.canAccessAdmin ?? false;
}

export function isAdmin(user: CurrentUser | null): boolean {
    return user?.role === 'admin';
}

export function getRemainingWorldGenerations(user: CurrentUser | null): number {
    if (!user) return 0;
    const limit = user.permissions.dailyWorldGenerationLimit;
    if (limit === -1) return Infinity;
    return Math.max(0, limit - user.todayWorldGenerationCount);
}
