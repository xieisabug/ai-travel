interface Testimonial {
    name: string;
    avatar: string;
    role: string;
    content: string;
}

interface TestimonialsSectionProps {
    testimonials: Testimonial[];
}

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
    return (
        <section id="testimonials" className="py-32 px-12 relative z-[1]">
            <SectionHeader
                tag="用户评价"
                title="听听探险者们怎么说"
                description="来自全球各地的真实反馈"
            />

            <div className="grid grid-cols-3 gap-6 max-w-[1200px] mx-auto">
                {testimonials.map((item, i) => (
                    <TestimonialCard key={i} testimonial={item} index={i} />
                ))}
            </div>
        </section>
    );
}

function SectionHeader({ tag, title, description }: { tag: string; title: string; description: string }) {
    return (
        <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-sm text-indigo-400 font-medium mb-4">
                {tag}
            </span>
            <h2 className="text-5xl font-bold tracking-tight mb-4">{title}</h2>
            <p className="text-white/50 text-lg max-w-[600px] mx-auto">
                {description}
            </p>
        </div>
    );
}

interface TestimonialCardProps {
    testimonial: Testimonial;
    index: number;
}

function TestimonialCard({ testimonial, index }: TestimonialCardProps) {
    return (
        <div
            className="p-8 bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.06] rounded-[20px] transition-all hover:border-white/10 hover:-translate-y-1 animate-fade-in-up"
            style={{ animationDelay: `${index * 0.1}s` }}
        >
            {/* 引用内容 */}
            <div className="mb-6">
                <div className="text-5xl leading-none bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent mb-2">
                    "
                </div>
                <p className="text-white/80 text-base leading-relaxed">
                    {testimonial.content}
                </p>
            </div>

            {/* 用户信息 */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-full flex items-center justify-center text-2xl">
                    {testimonial.avatar}
                </div>
                <div>
                    <div className="font-semibold mb-1">{testimonial.name}</div>
                    <div className="text-sm text-white/50">{testimonial.role}</div>
                </div>
            </div>
        </div>
    );
}

export type { Testimonial };
