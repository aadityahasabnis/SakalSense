import Link from 'next/link';

const FOOTER_LINKS = {
    product: [{ label: 'Features', href: '/features' }, { label: 'Pricing', href: '/pricing' }, { label: 'Courses', href: '/browse/courses' }, { label: 'Articles', href: '/browse/articles' }],
    company: [{ label: 'About', href: '/about' }, { label: 'Blog', href: '/blog' }, { label: 'Careers', href: '/careers' }, { label: 'Contact', href: '/contact' }],
    legal: [{ label: 'Privacy', href: '/privacy' }, { label: 'Terms', href: '/terms' }, { label: 'Cookies', href: '/cookies' }],
    social: [{ label: 'Twitter', href: 'https://twitter.com/sakalsense' }, { label: 'GitHub', href: 'https://github.com/sakalsense' }, { label: 'Discord', href: 'https://discord.gg/sakalsense' }],
} as const;

interface IFooterSectionProps { title: string; links: ReadonlyArray<{ label: string; href: string }>; external?: boolean }

const FooterSection = ({ title, links, external }: IFooterSectionProps) => (
    <div>
        <h3 className="mb-4 text-sm font-semibold">{title}</h3>
        <ul className="space-y-2">
            {links.map((link) => (
                <li key={link.href}>
                    {external ? (
                        <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{link.label}</a>
                    ) : (
                        <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{link.label}</Link>
                    )}
                </li>
            ))}
        </ul>
    </div>
);

export const Footer = () => (
    <footer className="border-t bg-muted/40">
        <div className="container py-12">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                <FooterSection title="Product" links={FOOTER_LINKS.product} />
                <FooterSection title="Company" links={FOOTER_LINKS.company} />
                <FooterSection title="Legal" links={FOOTER_LINKS.legal} />
                <FooterSection title="Connect" links={FOOTER_LINKS.social} external />
            </div>
            <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
                <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} SakalSense. All rights reserved.</p>
                <p className="text-sm text-muted-foreground">Built with ❤️ for learners</p>
            </div>
        </div>
    </footer>
);
