declare module "react-native-picker-select" {
  import { StyleProp, TextStyle, ViewStyle } from "react-native";

  interface PickerSelectProps {
    onValueChange: (value: string | number) => void;
    items: Array<{ label: string; value: string | number }>;
    value?: string | number;
    style?: {
      inputIOS?: StyleProp<TextStyle>;
      inputAndroid?: StyleProp<TextStyle>;
      viewContainer?: StyleProp<ViewStyle>;
    };
  }

  const RNPickerSelect: React.FC<PickerSelectProps>;
  export default RNPickerSelect;
}
