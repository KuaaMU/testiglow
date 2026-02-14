'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useT } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileFormProps {
  userId: string;
  initialName: string;
}

export function ProfileForm({ userId, initialName }: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const t = useT();

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: name.trim() })
      .eq('id', userId);

    if (error) {
      toast.error(t.settings.profile_failed);
    } else {
      toast.success(t.settings.profile_updated);
    }
    setSaving(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.settings.account}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">{t.settings.name}</Label>
          <div className="flex gap-2">
            <Input
              id="full_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.settings.your_name}
            />
            <Button
              onClick={handleSave}
              disabled={saving || !name.trim() || name === initialName}
              size="icon"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
