import { Link, useNavigate } from "react-router-dom";
import { CurrencyDisplay } from "~/components/currency-display";
import { UserInfo } from "~/components/auth/user-info";
import { useAuthContext } from "~/hooks/use-auth";

interface NavLink {
    href: string;
    label: string;
    isActive?: boolean;
}

interface NavbarProps {
    links?: NavLink[];
    showAuth?: boolean;
    onLoginClick?: () => void;
}

export function Navbar({ links = [], showAuth = true, onLoginClick }: NavbarProps) {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuthContext();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-12 py-4 bg-black/60 backdrop-blur-xl backdrop-saturate-150 border-b border-white/5">
            <Link
                to="/"
                className="text-xl font-semibold tracking-tight flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
                <span className="text-2xl bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                    ✦
                </span>
                云旅游
            </Link>

            <div className="flex items-center gap-10">
                {links.map((link, index) => (
                    <NavLinkItem key={index} {...link} />
                ))}

                {showAuth && (
                    <>
                        {isAuthenticated ? (
                            <div className="flex items-center gap-4">
                                {user?.role === "admin" && (
                                    <button
                                        onClick={() => navigate("/admin/worlds")}
                                        className="text-white/70 text-sm font-medium hover:text-white transition-colors relative group"
                                    >
                                        管理后台
                                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 transition-all group-hover:w-full" />
                                    </button>
                                )}
                                <CurrencyDisplay />
                                <UserInfo />
                            </div>
                        ) : (
                            <button
                                className="bg-white/10 text-white border border-white/20 px-5 py-2 rounded-full text-sm font-medium cursor-pointer transition-all hover:bg-white/15 hover:border-white/30"
                                onClick={onLoginClick}
                            >
                                登录
                            </button>
                        )}
                    </>
                )}
            </div>
        </nav>
    );
}

function NavLinkItem({ href, label, isActive }: NavLink) {
    if (isActive) {
        return (
            <span className="text-white text-sm font-medium relative">
                {label}
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500 to-purple-600" />
            </span>
        );
    }

    return (
        <a
            href={href}
            className="text-white/70 text-sm font-medium hover:text-white transition-colors relative group"
        >
            {label}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 transition-all group-hover:w-full" />
        </a>
    );
}
