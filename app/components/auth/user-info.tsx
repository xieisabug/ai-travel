import { useAuthContext } from '~/hooks/use-auth';
import { USER_ROLE_NAMES } from '~/types/user';
import { useNavigate } from 'react-router-dom';

interface UserInfoProps {
    onLogout?: () => void;
    showProfile?: boolean;
}

/**
 * 用户信息显示组件 - 显示头像、昵称和登出按钮
 */
export function UserInfo({ onLogout, showProfile = true }: UserInfoProps) {
    const { user, logout, isAuthenticated } = useAuthContext();
    const navigate = useNavigate();

    if (!isAuthenticated || !user) {
        return null;
    }

    const handleLogout = async () => {
        await logout();
        onLogout?.();
    };

    const handleAvatarClick = () => {
        if (showProfile) {
            navigate('/profile');
        }
    };

    return (
        <div className="flex items-center gap-3">
            {/* 头像 */}
            <button
                onClick={handleAvatarClick}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity"
                title="查看个人中心"
            >
                {user.displayName.charAt(0).toUpperCase()}
            </button>

            {/* 用户信息 */}
            <div className="flex flex-col">
                <span className="text-white font-medium text-sm">{user.displayName}</span>
                <span className="text-xs text-white/40">
                    {USER_ROLE_NAMES[user.role]}
                </span>
            </div>

            {/* 登出按钮 */}
            <button
                onClick={handleLogout}
                className="ml-2 px-3 py-1.5 text-sm text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
                退出
            </button>
        </div>
    );
}
