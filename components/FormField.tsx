import React, { useState } from 'react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { BORDER_RADIUS, COLORS, TYPOGRAPHY } from '../constants/theme';

interface FormFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password';
}

const FormField = <T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  type = 'text',
}: FormFieldProps<T>) => {
  const isPassword = type === 'password';
  const [showPassword, setShowPassword] = useState(false);
  const keyboardType = type === 'email' ? 'email-address' : 'default';

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <View style={styles.fieldContainer}>
          <TextInput
            label={label}
            value={value}
            onChangeText={onChange}
            placeholder={placeholder || `Enter your ${label}`}
            secureTextEntry={isPassword && !showPassword}
            keyboardType={keyboardType}
            mode="outlined"
            right={
              isPassword ? (
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword((visible) => !visible)}
                  forceTextInputFocus={false}
                />
              ) : undefined
            }
            style={[styles.input, error && styles.inputError]}
            outlineColor={COLORS.borderLight}
            activeOutlineColor={COLORS.primary}
            textColor={COLORS.textPrimary}
            placeholderTextColor={COLORS.textSecondary}
            theme={{
              colors: {
                background: COLORS.background,
                text: COLORS.textPrimary,
                placeholder: COLORS.textSecondary,
                primary: COLORS.primary,
                onSurfaceVariant: COLORS.textSecondary,
              },
            }}
          />
          {error && <Text style={styles.errorText}>{error.message}</Text>}
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: 16,
  },
  input: {
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: COLORS.background,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.fontSize.small,
    marginTop: 4,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
});

export default FormField;