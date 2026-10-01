import React from 'react';
import { View, TextInput, TouchableOpacity, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = TextInputProps & {
  value: string;
  onChangeText: (text: string) => void;
  containerClassName?: string;
};

export function SearchInput({
  value,
  onChangeText,
  containerClassName = 'flex-row items-center bg-gray-100 rounded-xl mx-4 mt-4 px-3 h-12',
  placeholder = 'Search...',
  placeholderTextColor = '#888',
  ...rest
}: Props) {
  return (
    <View className={containerClassName}>
      <Ionicons name="search" size={20} color="#888" />
      <TextInput
        className="flex-1 ml-2 text-base"
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        value={value}
        onChangeText={onChangeText}
        {...rest}
      />
      {value.length > 0 ? (
        <TouchableOpacity
          onPress={() => onChangeText('')}
          accessibilityLabel="Clear search"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close-circle" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
