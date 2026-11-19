export interface SocialLink {
  label: string;
  href: string;
}

export interface SiteConfig {
  name: string;
  shortDescription: string;
  email: string;
  siteUrl: string;
  profileImage: string;
  profileImageAlt: string;
  cvPath: string;
  socials: SocialLink[];
  authorNameVariants: string[];
}

const contactEmail = 'pablosanserr@gmail.com';

export const siteConfig: SiteConfig = {
  name: 'Pablo Sánchez Serrano',
  shortDescription: 'Privacy, artificial intelligence, and applied research.',
  email: contactEmail,
  siteUrl: 'https://pablosanserr.github.io',
  profileImage: '/images/profile.jpg',
  profileImageAlt: 'Portrait of Pablo Sánchez Serrano',
  cvPath: '/cv/pablo-sanchez-serrano-cv.pdf',
  socials: [
    { label: 'GitHub', href: 'https://github.com/Pablosanserr' },
    {
      label: 'Google Scholar',
      href: 'https://scholar.google.es/citations?user=R7pV8fsAAAAJ&hl=es',
    },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/pablo-sanchez-serrano/' },
    { label: 'ORCID', href: 'https://orcid.org/0009-0007-8769-0516' },
    { label: 'Email', href: `mailto:${contactEmail}` },
  ],
  authorNameVariants: [
    'Pablo Sánchez Serrano',
    'Pablo Sanchez Serrano',
    'Sánchez Serrano, Pablo',
    'Sanchez Serrano, Pablo',
    'Pablo Sánchez-Serrano',
    'Pablo Sanchez-Serrano',
    'Sánchez-Serrano, Pablo',
    'Sanchez-Serrano, Pablo',
  ],
};
