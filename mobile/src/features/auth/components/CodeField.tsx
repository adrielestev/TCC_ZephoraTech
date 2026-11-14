import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { TextField } from '@/ui/TextField';

interface Props<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
}

/** Campo do código de 6 dígitos recebido por e-mail (só aceita números). */
export function CodeField<T extends FieldValues>({ control, name, label = 'Código de 6 dígitos' }: Props<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          label={label}
          value={(field.value as string | undefined) ?? ''}
          onChangeText={(text) => field.onChange(text.replace(/\D/g, '').slice(0, 6))}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={6}
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          placeholder="000000"
        />
      )}
    />
  );
}
