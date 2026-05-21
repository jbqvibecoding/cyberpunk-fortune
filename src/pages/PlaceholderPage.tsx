import { ReactNode } from 'react';

export default function PlaceholderPage({ title, hint }: { title: string; hint: ReactNode }) {
  return (
    <div className="px-4 md:px-8 py-16 max-w-3xl mx-auto">
      <h1 className="font-cn text-3xl">{title}</h1>
      <p className="font-cn text-muted-foreground text-sm mt-3">{hint}</p>
      <div className="mt-8 cyber-card p-10 text-center">
        <div className="font-mono text-[11px] tracking-[0.4em] text-secondary">COMING SOON</div>
        <div className="font-cn text-muted-foreground text-sm mt-3">
          此页面占位，等待后续接入。
        </div>
      </div>
    </div>
  );
}
