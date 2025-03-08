import React from 'react';
import { UseFormRegister, FieldError, Path, FieldValues } from 'react-hook-form';

interface FormInputProps<TFormValues extends FieldValues> {
  id: Path<TFormValues>;
  label: string;
  type?: string;
  placeholder?: string;
  error?: FieldError;
  register: UseFormRegister<TFormValues>;
  required?: boolean;
}

export const FormInput = <TFormValues extends FieldValues>({
  id,
  label,
  type = 'text',
  placeholder,
  error,
  register,
  required = false
}: FormInputProps<TFormValues>): React.ReactElement => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        type={type}
        {...register(id, { required })}
        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        placeholder={placeholder}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error.message}</p>
      )}
    </div>
  );
};
