
import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeMood = async (entry) => {
  const timestamp = new Date().toISOString();
  const existing = await AsyncStorage.getItem('moodLogs');
  const logs = existing ? JSON.parse(existing) : [];
  logs.push({ ...entry, timestamp });
  await AsyncStorage.setItem('moodLogs', JSON.stringify(logs));
};

export const getMoodHistory = async () => {
  try {
    const existing = await AsyncStorage.getItem('moodLogs');
    return existing ? JSON.parse(existing) : [];
  } catch (error) {
    console.error('Error loading mood history:', error);
    return [];
  }
};

export const saveMood = async (mood, message, reply) => {
  try {
    await storeMood({ mood, message, reply });
  } catch (error) {
    console.error('Error saving mood:', error);
  }
};
