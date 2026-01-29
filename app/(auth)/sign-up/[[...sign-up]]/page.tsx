import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <SignUp
      appearance={{
        elements: {
          rootBox: 'w-full',
          card: 'bg-light border border-sand shadow-lg',
          headerTitle: 'font-heading text-dark',
          headerSubtitle: 'font-body text-gray',
          formButtonPrimary:
            'bg-accent hover:bg-coral-dark text-light font-heading',
          formFieldInput:
            'border-gray focus:border-slate-blue focus:ring-slate-blue/20',
          footerActionLink: 'text-accent hover:text-coral-dark',
          identityPreviewText: 'text-dark',
          identityPreviewEditButton: 'text-accent',
          socialButtonsBlockButton:
            'border-gray hover:bg-sand text-dark font-body',
          dividerLine: 'bg-sand',
          dividerText: 'text-gray font-body',
        },
        variables: {
          colorPrimary: '#c6603f',
          colorBackground: '#faf9f5',
          colorText: '#141413',
          colorTextSecondary: '#b0aea5',
          fontFamily: 'var(--font-body)',
          borderRadius: '6px',
        },
      }}
      forceRedirectUrl="/onboarding"
    />
  );
}
