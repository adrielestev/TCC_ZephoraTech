// src/ui/FormField.tsx -- Conecta campos de formulário às mensagens de rótulo, ajuda e validação.
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import type { TextInputProps } from 'react-native';
import type { Ref } from 'react';
import { TextField, type TextInputHandle } from './TextField';

interface Props<T extends FieldValues> extends Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'style'
> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  hint?: string;
  inputRef?: Ref<TextInputHandle>;
}

/** TextField ligado ao react-hook-form (valor, erro e blur). */
export function FormField<T extends FieldValues>({
  control,
  name,
  label,
  hint,
  inputRef,
  ...rest
}: Props<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...rest}
          ref={inputRef}
          label={label}
          hint={hint}
          value={(field.value as string | undefined) ?? ''}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}
