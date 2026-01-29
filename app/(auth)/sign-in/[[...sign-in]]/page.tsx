import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <SignIn
      appearance={{
        elements: {
          rootBox: 'w-full',
          card: 'bg-light border-2 border-dark shadow-none',
          headerTitle: 'type-display text-dark text-2xl',
          headerSubtitle: 'type-mono-look text-gray',
          formButtonPrimary:
            'btn-brutal btn-brutal-primary w-full justify-center',
          formFieldInput:
            'input-brutal',
          footerActionLink: 'type-mono-look text-accent hover:text-dark',
          identityPreviewText: 'text-dark',
          identityPreviewEditButton: 'text-accent',
          socialButtonsBlockButton:
            'btn-brutal btn-brutal-secondary w-full justify-center',
          dividerLine: 'bg-dark/20',
          dividerText: 'type-mono-look text-gray',
        },
        variables: {
          colorPrimary: '#FF4D00',
          colorBackground: '#FFFFFF',
          colorText: '#000000',
          colorTextSecondary: '#666666',
          fontFamily: 'var(--font-body)',
          borderRadius: '0px',
        },
      }}
      forceRedirectUrl="/onboarding"
    />
  );
}
