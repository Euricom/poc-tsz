import { useState } from 'react';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { getServerSession as getServerSessionImpl } from '#/lib/auth.server';
import { signInWithMicrosoft } from '#/lib/auth-client';

const getServerSession = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest();
  if (!request) return null;
  return getServerSessionImpl(request.headers);
});

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const session = await getServerSession();
    if (session?.user) {
      console.log('[login] already signed in → /');
      throw redirect({ to: '/' });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState('jens.vermeulen@euri.com');
  const [sent, setSent] = useState(false);

  const handleMicrosoft = () => {
    console.log('[login] sign-in clicked → microsoft');
    void signInWithMicrosoft('/');
  };

  const handleGoogle = () => {
    console.log('[login] google sign-in (not implemented)');
  };

  const handleSendCode = () => {
    if (!email) return;
    console.log('[login] email otp (not implemented) →', email);
    setSent(true);
  };

  return (
    <main className="min-h-dvh bg-euri-deep font-display text-white antialiased">
      <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-[1.25fr_1fr]">
        <Showcase />
        <AuthPanel
          email={email}
          setEmail={setEmail}
          sent={sent}
          onSendCode={handleSendCode}
          onChangeEmail={() => setSent(false)}
          onMicrosoft={handleMicrosoft}
          onGoogle={handleGoogle}
        />
      </div>
    </main>
  );
}

function Showcase() {
  return (
    <aside className="relative hidden overflow-hidden bg-[#0a0d11] lg:block">
      <img
        src="/euri/tsz-photo.png"
        alt="Timesheet Zone on a laptop next to a Euricom mug"
        className="absolute inset-0 size-full object-cover object-center"
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(20,26,32,0.45)_0%,rgba(20,26,32,0)_24%,rgba(20,26,32,0)_55%,rgba(20,26,32,0.92)_100%)]" />

      <header className="absolute inset-x-14 top-10 z-10 flex items-center">
        <img src="/euri/logo-wordmark.svg" alt="euricom" className="h-7" />
      </header>

      <div className="absolute inset-x-14 bottom-12 z-10">
        <div className="mb-3.5 text-xs font-medium uppercase tracking-[0.32em] text-euri-green">
          Timesheet Zone · for Tech Tribes
        </div>
        <h2 className="m-0 max-w-[540px] text-[clamp(44px,4.6vw,64px)] font-bold leading-[0.98] tracking-[-0.02em] [text-shadow:0_2px_24px_rgba(0,0,0,0.5)]">
          Drop hours.
          <br />
          <em className="font-light italic text-euri-green">Ship the week.</em>
        </h2>
        <p className="mt-5 max-w-[460px] text-base leading-[1.5] text-white/70 [text-shadow:0_1px_12px_rgba(0,0,0,0.5)]">
          Used by 17 tribes · 4,231 entries logged this week.
        </p>
      </div>
    </aside>
  );
}

type AuthPanelProps = {
  email: string;
  setEmail: (v: string) => void;
  sent: boolean;
  onSendCode: () => void;
  onChangeEmail: () => void;
  onMicrosoft: () => void;
  onGoogle: () => void;
};

function AuthPanel({ email, setEmail, sent, onSendCode, onChangeEmail, onMicrosoft, onGoogle }: AuthPanelProps) {
  return (
    <section className="relative flex flex-col border-l border-white/15 bg-euri-charcoal px-6 py-10 sm:px-10 lg:px-14">
      <div className="flex justify-end">
        <LangToggle />
      </div>

      <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center">
        <img src="/euri/brandmark.svg" alt="" aria-hidden="true" className="mb-6 size-10 opacity-95" />

        <h1 className="m-0 text-[32px] font-bold leading-[1.1] tracking-[-0.015em]">
          Sign in to <em className="font-light italic text-euri-green">Timesheet Zone.</em>
        </h1>
        <p className="mb-7 mt-3 text-sm leading-[1.55] text-white/50">One identity across every Euricom app.</p>

        <div className="flex flex-col gap-2.5">
          <ProviderButton onClick={onMicrosoft} icon={<MicrosoftIcon />} label="Continue with Microsoft" hint="SSO" />
          <ProviderButton onClick={onGoogle} icon={<GoogleIcon />} label="Continue with Google" hint="Soon" />
        </div>

        <Divider>or use email</Divider>

        {sent ? (
          <OtpStep email={email} onChangeEmail={onChangeEmail} />
        ) : (
          <EmailField email={email} setEmail={setEmail} onSend={onSendCode} />
        )}

        <p className="mt-7 text-xs leading-[1.6] tracking-[0.04em] text-white/30">
          New to Tech Tribes?{' '}
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="text-white/70 underline underline-offset-[3px] transition-colors hover:text-euri-green"
          >
            Ask your tribe lead for access
          </a>
          .
        </p>
      </div>

      <footer className="flex items-center gap-4 text-xs uppercase tracking-[0.06em] text-white/30">
        <span>© 2026 Euricom</span>
        <span className="text-euri-green">·</span>
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="text-white/50 transition-colors hover:text-euri-green"
        >
          Privacy
        </a>
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="text-white/50 transition-colors hover:text-euri-green"
        >
          Status
        </a>
      </footer>
    </section>
  );
}

function LangToggle() {
  return (
    <div className="text-[13px] font-medium uppercase tracking-[0.18em] text-white/50">
      <span className="text-white">EN</span>
      <span className="mx-2 font-bold text-euri-green">/</span>
      <span>NL</span>
    </div>
  );
}

type ProviderButtonProps = {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  hint?: string;
};

function ProviderButton({ onClick, icon, label, hint }: ProviderButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3.5 rounded-[10px] border border-white/10 bg-white/5 px-[18px] py-3.5 text-left text-[15px] font-medium text-white transition-all duration-200 ease-out hover:-translate-y-px hover:border-euri-green/40 hover:bg-euri-green/[0.06] active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-euri-green"
    >
      <span className="flex size-[22px] shrink-0 items-center justify-center">{icon}</span>
      <span className="flex-1">{label}</span>
      {hint && (
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/30 transition-colors group-hover:text-euri-green">
          {hint}
        </span>
      )}
    </button>
  );
}

function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-5 flex items-center gap-4 text-[11px] font-medium uppercase tracking-[0.32em] text-white/30">
      <span className="h-px flex-1 bg-white/10" aria-hidden="true" />
      <span>{children}</span>
      <span className="h-px flex-1 bg-white/10" aria-hidden="true" />
    </div>
  );
}

type EmailFieldProps = {
  email: string;
  setEmail: (v: string) => void;
  onSend: () => void;
};

function EmailField({ email, setEmail, onSend }: EmailFieldProps) {
  return (
    <div className="group relative flex items-stretch rounded-[10px] border border-white/10 bg-white/5 transition-colors duration-200 focus-within:border-euri-green">
      <span className="flex items-center pl-4 text-white/50" aria-hidden="true">
        <MailIcon />
      </span>
      <input
        type="email"
        autoComplete="email"
        placeholder="you@euri.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSend();
        }}
        className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-[15px] tracking-[0.01em] text-white placeholder:text-white/30 focus:outline-none"
      />
      <button
        type="button"
        onClick={onSend}
        className="flex items-center gap-2 border-l border-white/10 px-[18px] text-[13px] font-semibold uppercase tracking-[0.18em] text-euri-green transition-colors duration-200 hover:bg-euri-green/[0.08]"
      >
        Send <ArrowRight />
      </button>
    </div>
  );
}

type OtpStepProps = {
  email: string;
  onChangeEmail: () => void;
};

function OtpStep({ email, onChangeEmail }: OtpStepProps) {
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);

  const onDigit = (idx: number, v: string) => {
    const next = [...code];
    next[idx] = v.slice(-1).toUpperCase();
    setCode(next);
  };

  return (
    <div className="rounded-[10px] border border-euri-green/40 bg-euri-green/[0.04] px-[18px] pb-[18px] pt-4">
      <div className="mb-1 flex items-center justify-between gap-3">
        <div>
          <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.32em] text-euri-green">
            Code sent · check your inbox
          </div>
          <div className="text-[15px] font-semibold tabular-nums text-white">{email}</div>
        </div>
        <button
          type="button"
          onClick={onChangeEmail}
          className="rounded px-1.5 py-1 text-[12px] font-medium uppercase tracking-[0.08em] text-white/50 underline decoration-white/15 underline-offset-[4px] transition-colors hover:text-euri-green hover:decoration-euri-green"
        >
          Change
        </button>
      </div>

      <div className="mt-3 grid grid-cols-6 gap-2">
        {code.map((c, i) => (
          <input
            key={i}
            inputMode="text"
            maxLength={1}
            value={c}
            onChange={(e) => onDigit(i, e.target.value)}
            aria-label={`Digit ${i + 1}`}
            className="h-14 rounded-[10px] border border-white/10 bg-white/5 text-center text-[22px] font-semibold caret-euri-green outline-none transition-all duration-200 focus:border-euri-green focus:shadow-[0_0_0_3px_rgba(0,255,0,0.18)]"
          />
        ))}
      </div>

      <div className="mt-3.5 flex items-center gap-2 text-xs tracking-[0.04em] text-white/50">
        <button
          type="button"
          className="border-0 bg-transparent p-0 font-semibold text-euri-green underline underline-offset-[3px] disabled:opacity-50"
          disabled
        >
          Resend
        </button>
        <span className="text-white/15">·</span>
        <span className="tabular-nums text-white/30">expires in 9:42</span>
      </div>
    </div>
  );
}

function MicrosoftIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="1" y="1" width="10" height="10" fill="#F25022" />
      <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
      <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
      <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
    </svg>
  );
}

function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20.4H24v7.2h11.3c-1.5 4.2-5.5 7.2-10.3 7.2-6 0-10.9-4.9-10.9-10.8S19 13.2 25 13.2c2.7 0 5.2 1 7.1 2.7l5.1-5.1C34 7.9 29.7 6 25 6 14.6 6 6.1 14.5 6.1 24.9S14.6 43.8 25 43.8c10.4 0 18.9-8.5 18.9-18.9 0-1.5-.1-2.9-.3-4.4z"
      />
      <path
        fill="#FF3D00"
        d="M8.3 14.6l5.9 4.3c1.6-3.9 5.4-6.7 9.8-6.7 2.7 0 5.2 1 7.1 2.7l5.1-5.1C34 7.9 29.7 6 25 6 17.7 6 11.3 10.1 8.3 14.6z"
      />
      <path
        fill="#4CAF50"
        d="M25 43.8c4.6 0 8.8-1.8 12-4.6l-5.5-4.7c-1.7 1.3-3.9 2.1-6.5 2.1-4.7 0-8.7-3-10.2-7.2l-5.9 4.5c2.9 5.7 8.9 9.9 16.1 9.9z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20.4H24v7.2h11.3c-.7 2-2 3.8-3.6 5.1l5.5 4.7c-.4.4 6.5-4.8 6.5-13 0-1.5-.1-2.9-.3-4.4z"
      />
    </svg>
  );
}

function MailIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

function ArrowRight({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="M13 5l7 7-7 7" />
    </svg>
  );
}
