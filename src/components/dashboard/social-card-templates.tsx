import type { Testimonial } from '@/types';

interface TemplateProps {
  testimonial: Testimonial;
  showWatermark: boolean;
  brandColor?: string;
}

function renderStars(rating: number | null) {
  if (rating === null) return null;
  const stars = [];
  for (let i = 0; i < 5; i++) {
    stars.push(
      <span key={i} style={{ fontSize: '24px', color: i < rating ? '#facc15' : '#d1d5db' }}>
        ★
      </span>
    );
  }
  return <div style={{ display: 'flex', gap: '2px', marginBottom: '16px' }}>{stars}</div>;
}

function Watermark() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20px',
        right: '24px',
        fontSize: '12px',
        color: 'rgba(0,0,0,0.35)',
      }}
    >
      Made with TestiSpark
    </div>
  );
}

export function MinimalTemplate({ testimonial, showWatermark }: TemplateProps) {
  const t = testimonial;
  const initial = t.author_name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div
      style={{
        width: '1200px',
        height: '675px',
        backgroundColor: '#ffffff',
        border: '2px solid #e5e7eb',
        borderRadius: '16px',
        padding: '60px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {renderStars(t.rating)}
      <p
        style={{
          fontSize: '28px',
          lineHeight: '1.5',
          color: '#111827',
          marginBottom: '32px',
          maxHeight: '210px',
          overflow: 'hidden',
        }}
      >
        &ldquo;{t.content}&rdquo;
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#e0e7ff',
            color: '#4f46e5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: 700,
          }}
        >
          {initial}
        </div>
        <div>
          <p style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0 }}>
            {t.author_name}
          </p>
          {t.author_company && (
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '2px 0 0' }}>
              {t.author_company}
            </p>
          )}
        </div>
      </div>
      {showWatermark && <Watermark />}
    </div>
  );
}

export function GradientTemplate({ testimonial, showWatermark }: TemplateProps) {
  const t = testimonial;
  const initial = t.author_name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div
      style={{
        width: '1200px',
        height: '675px',
        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
        borderRadius: '16px',
        padding: '60px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {t.rating !== null && (
        <div style={{ display: 'flex', gap: '2px', marginBottom: '16px' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              style={{
                fontSize: '24px',
                color: i < (t.rating ?? 0) ? '#fde68a' : 'rgba(255,255,255,0.3)',
              }}
            >
              ★
            </span>
          ))}
        </div>
      )}
      <p
        style={{
          fontSize: '28px',
          lineHeight: '1.5',
          color: '#ffffff',
          marginBottom: '32px',
          maxHeight: '210px',
          overflow: 'hidden',
        }}
      >
        &ldquo;{t.content}&rdquo;
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: 700,
          }}
        >
          {initial}
        </div>
        <div>
          <p style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', margin: 0 }}>
            {t.author_name}
          </p>
          {t.author_company && (
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)', margin: '2px 0 0' }}>
              {t.author_company}
            </p>
          )}
        </div>
      </div>
      {showWatermark && (
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '24px',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.4)',
          }}
        >
          Made with TestiSpark
        </div>
      )}
    </div>
  );
}

export function DarkTemplate({ testimonial, showWatermark }: TemplateProps) {
  const t = testimonial;
  const initial = t.author_name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div
      style={{
        width: '1200px',
        height: '675px',
        backgroundColor: '#1a1a2e',
        borderRadius: '16px',
        padding: '60px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {renderStars(t.rating)}
      <p
        style={{
          fontSize: '28px',
          lineHeight: '1.5',
          color: '#f1f5f9',
          marginBottom: '32px',
          maxHeight: '210px',
          overflow: 'hidden',
        }}
      >
        &ldquo;{t.content}&rdquo;
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#334155',
            color: '#e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: 700,
          }}
        >
          {initial}
        </div>
        <div>
          <p style={{ fontSize: '18px', fontWeight: 600, color: '#f1f5f9', margin: 0 }}>
            {t.author_name}
          </p>
          {t.author_company && (
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: '2px 0 0' }}>
              {t.author_company}
            </p>
          )}
        </div>
      </div>
      {showWatermark && (
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '24px',
            fontSize: '12px',
            color: 'rgba(241,245,249,0.3)',
          }}
        >
          Made with TestiSpark
        </div>
      )}
    </div>
  );
}

export function BrandTemplate({ testimonial, showWatermark, brandColor = '#6366f1' }: TemplateProps) {
  const t = testimonial;
  const initial = t.author_name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div
      style={{
        width: '1200px',
        height: '675px',
        backgroundColor: brandColor,
        borderRadius: '16px',
        padding: '60px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {t.rating !== null && (
        <div style={{ display: 'flex', gap: '2px', marginBottom: '16px' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              style={{
                fontSize: '24px',
                color: i < (t.rating ?? 0) ? '#fde68a' : 'rgba(255,255,255,0.3)',
              }}
            >
              ★
            </span>
          ))}
        </div>
      )}
      <p
        style={{
          fontSize: '28px',
          lineHeight: '1.5',
          color: '#ffffff',
          marginBottom: '32px',
          maxHeight: '210px',
          overflow: 'hidden',
        }}
      >
        &ldquo;{t.content}&rdquo;
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: 700,
          }}
        >
          {initial}
        </div>
        <div>
          <p style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', margin: 0 }}>
            {t.author_name}
          </p>
          {t.author_company && (
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)', margin: '2px 0 0' }}>
              {t.author_company}
            </p>
          )}
        </div>
      </div>
      {showWatermark && (
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '24px',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.4)',
          }}
        >
          Made with TestiSpark
        </div>
      )}
    </div>
  );
}
