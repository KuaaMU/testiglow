'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Copy, CheckCircle2 } from 'lucide-react';

type Tone = 'professional' | 'casual' | 'friendly';

interface EmailTemplateGeneratorProps {
  formName: string;
  collectionUrl: string;
}

function generateTemplate(formName: string, collectionUrl: string, tone: Tone): string {
  switch (tone) {
    case 'professional':
      return `Subject: We'd Love Your Feedback on ${formName}

Dear Valued Customer,

Thank you for choosing ${formName}. Your experience matters to us, and we would greatly appreciate it if you could take a moment to share your feedback.

Your testimonial helps us improve and also helps others make informed decisions.

Please share your thoughts here:
${collectionUrl}

It only takes a minute, and your input is invaluable.

Thank you for your time and continued support.

Best regards`;

    case 'casual':
      return `Subject: Quick favor? Share your thoughts on ${formName}

Hey there!

Hope you're doing well. I wanted to reach out and ask if you'd be willing to share a quick testimonial about your experience with ${formName}.

It'll only take a minute — just click the link below:
${collectionUrl}

Your feedback really helps us out and lets others know what to expect. No pressure at all, but we'd really appreciate it!

Thanks a bunch!`;

    case 'friendly':
      return `Subject: We'd love to hear from you!

Hi there!

We hope you've been enjoying ${formName}! We're reaching out because your opinion truly means the world to us.

Would you mind sharing a few words about your experience? It's super quick and easy — just click here:
${collectionUrl}

Your testimonial helps us grow and helps others discover what we do. We're so grateful for your support!

Warmly,
The ${formName} Team`;
  }
}

export function EmailTemplateGenerator({ formName, collectionUrl }: EmailTemplateGeneratorProps) {
  const [tone, setTone] = useState<Tone>('professional');
  const [copied, setCopied] = useState(false);
  const t = useT();

  const template = generateTemplate(formName, collectionUrl, tone);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(template);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = template;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t.email_template.tone} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="professional">{t.email_template.professional}</SelectItem>
            <SelectItem value="casual">{t.email_template.casual}</SelectItem>
            <SelectItem value="friendly">{t.email_template.friendly}</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
          {copied ? (
            <>
              <CheckCircle2 className="size-3.5 text-green-500" />
              {t.common.copied}
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              {t.email_template.copy_email}
            </>
          )}
        </Button>
      </div>

      <Textarea
        value={template}
        readOnly
        rows={14}
        className="resize-none font-mono text-sm"
      />
    </div>
  );
}
