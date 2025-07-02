
import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeMood = async (entry) => {
  const timestamp = new Date().toISOString();
  const existing = await AsyncStorage.getItem('moodLogs');
  const logs = existing ? JSON.parse(existing) : [];
  logs.push({ ...entry, timestamp });
  await AsyncStorage.setItem('moodLogs', JSON.stringify(logs));
};
