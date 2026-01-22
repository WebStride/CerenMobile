import { Stack } from 'expo-router';

export default function InvoicesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="[invoiceId]" 
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
