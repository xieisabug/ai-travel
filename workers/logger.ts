/**
 * 日志工具
 * 
 * 提供统一的日志格式和级别控制
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogColors {
    reset: string;
    bright: string;
    dim: string;
    red: string;
    green: string;
    yellow: string;
    blue: string;
    magenta: string;
    cyan: string;
}

const colors: LogColors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

const levelColors: Record<LogLevel, string> = {
    debug: colors.dim,
    info: colors.green,
    warn: colors.yellow,
    error: colors.red,
};

const levelIcons: Record<LogLevel, string> = {
    debug: '🔍',
    info: '✅',
    warn: '⚠️',
    error: '❌',
};

function formatTime(): string {
    const now = new Date();
    return now.toLocaleTimeString('zh-CN', { hour12: false });
}

function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
}

class Logger {
    private context: string;
    private startTimes: Map<string, number> = new Map();

    constructor(context: string) {
        this.context = context;
    }

    private log(level: LogLevel, message: string, data?: unknown): void {
        const time = formatTime();
        const color = levelColors[level];
        const icon = levelIcons[level];

        const prefix = `${colors.dim}[${time}]${colors.reset} ${icon} ${colors.cyan}[${this.context}]${colors.reset}`;

        if (data !== undefined) {
            console.log(`${prefix} ${color}${message}${colors.reset}`, data);
        } else {
            console.log(`${prefix} ${color}${message}${colors.reset}`);
        }
    }

    debug(message: string, data?: unknown): void {
        this.log('debug', message, data);
    }

    info(message: string, data?: unknown): void {
        this.log('info', message, data);
    }

    warn(message: string, data?: unknown): void {
        this.log('warn', message, data);
    }

    error(message: string, data?: unknown): void {
        this.log('error', message, data);
    }

    /**
     * 开始计时
     */
    startTimer(label: string): void {
        this.startTimes.set(label, Date.now());
        this.info(`⏱️ 开始: ${label}`);
    }

    /**
     * 结束计时并输出
     */
    endTimer(label: string, success: boolean = true): void {
        const startTime = this.startTimes.get(label);
        if (startTime) {
            const duration = Date.now() - startTime;
            const status = success ? '✅ 完成' : '❌ 失败';
            this.info(`${status}: ${label} (${formatDuration(duration)})`);
            this.startTimes.delete(label);
        }
    }

    /**
     * 输出进度
     */
    progress(current: number, total: number, label: string): void {
        const percent = Math.round((current / total) * 100);
        const bar = '█'.repeat(Math.floor(percent / 5)) + '░'.repeat(20 - Math.floor(percent / 5));
        console.log(`${colors.dim}[${formatTime()}]${colors.reset} 📊 ${colors.cyan}[${this.context}]${colors.reset} ${bar} ${percent}% ${label} (${current}/${total})`);
    }

    /**
     * 输出分隔线
     */
    separator(title?: string): void {
        const line = '═'.repeat(50);
        if (title) {
            console.log(`\n${colors.cyan}╔${line}╗${colors.reset}`);
            console.log(`${colors.cyan}║${colors.reset} ${colors.bright}${title.padEnd(48)}${colors.reset} ${colors.cyan}║${colors.reset}`);
            console.log(`${colors.cyan}╚${line}╝${colors.reset}\n`);
        } else {
            console.log(`${colors.dim}${'─'.repeat(52)}${colors.reset}`);
        }
    }

    /**
     * 创建子 Logger
     */
    child(subContext: string): Logger {
        return new Logger(`${this.context}:${subContext}`);
    }
}

/**
 * 创建 Logger 实例
 */
export function createLogger(context: string): Logger {
    return new Logger(context);
}

// 预创建的 Logger 实例
export const apiLogger = createLogger('API');
export const taskLogger = createLogger('Task');
export const aiLogger = createLogger('AI');
export const dbLogger = createLogger('DB');

export default Logger;
