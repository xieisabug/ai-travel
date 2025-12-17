import { useState } from 'react';
import { useAuthContext } from '~/hooks/use-auth';
import { FormInput } from './form-input';
import { SubmitButton } from './submit-button';

interface RegisterFormProps {
    onSuccess: () => void;
    onError: (error: string) => void;
    isLoading: boolean;
}

export function RegisterForm({ onSuccess, onError, isLoading }: RegisterFormProps) {
    const { register, clearError } = useAuthContext();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        displayName: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        onError('');
        clearError();

        if (!formData.username || !formData.email || !formData.password) {
            onError('请填写所有必填项');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            onError('两次输入的密码不一致');
            return;
        }

        if (formData.password.length < 6) {
            onError('密码至少需要6个字符');
            return;
        }

        const success = await register({
            username: formData.username,
            email: formData.email,
            password: formData.password,
            displayName: formData.displayName || undefined,
        });

        if (success) {
            onSuccess();
            setFormData({
                username: '',
                email: '',
                password: '',
                confirmPassword: '',
                displayName: '',
            });
        }
    };

    const updateField = (field: keyof typeof formData) => (value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FormInput
                label="用户名"
                type="text"
                value={formData.username}
                onChange={updateField('username')}
                placeholder="3-20个字符，字母、数字、下划线"
                disabled={isLoading}
                required
            />
            <FormInput
                label="邮箱"
                type="email"
                value={formData.email}
                onChange={updateField('email')}
                placeholder="your@email.com"
                disabled={isLoading}
                required
            />
            <FormInput
                label="显示名称"
                type="text"
                value={formData.displayName}
                onChange={updateField('displayName')}
                placeholder="可选，默认使用用户名"
                disabled={isLoading}
            />
            <FormInput
                label="密码"
                type="password"
                value={formData.password}
                onChange={updateField('password')}
                placeholder="至少6个字符"
                disabled={isLoading}
                required
            />
            <FormInput
                label="确认密码"
                type="password"
                value={formData.confirmPassword}
                onChange={updateField('confirmPassword')}
                placeholder="再次输入密码"
                disabled={isLoading}
                required
            />
            <SubmitButton loading={isLoading} className="mt-2">
                {isLoading ? '注册中...' : '注册'}
            </SubmitButton>
        </form>
    );
}
