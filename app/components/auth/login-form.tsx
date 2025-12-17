import { useState } from 'react';
import { useAuthContext } from '~/hooks/use-auth';
import type { LoginResponse } from '~/types/user';
import { FormInput } from './form-input';
import { SubmitButton } from './submit-button';

interface LoginFormProps {
    onSuccess: (loginResponse?: LoginResponse) => void;
    onError: (error: string) => void;
    isLoading: boolean;
}

export function LoginForm({ onSuccess, onError, isLoading }: LoginFormProps) {
    const { login, clearError } = useAuthContext();
    
    const [formData, setFormData] = useState({
        usernameOrEmail: '',
        password: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        onError('');
        clearError();

        if (!formData.usernameOrEmail || !formData.password) {
            onError('请填写所有必填项');
            return;
        }

        const loginResponse = await login(formData);
        if (loginResponse) {
            onSuccess(loginResponse);
            setFormData({ usernameOrEmail: '', password: '' });
        }
    };

    const updateField = (field: keyof typeof formData) => (value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <FormInput
                label="用户名或邮箱"
                type="text"
                value={formData.usernameOrEmail}
                onChange={updateField('usernameOrEmail')}
                placeholder="输入用户名或邮箱"
                disabled={isLoading}
            />
            <FormInput
                label="密码"
                type="password"
                value={formData.password}
                onChange={updateField('password')}
                placeholder="输入密码"
                disabled={isLoading}
            />
            <SubmitButton loading={isLoading}>
                {isLoading ? '登录中...' : '登录'}
            </SubmitButton>
        </form>
    );
}
