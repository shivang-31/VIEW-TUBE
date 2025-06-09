// utils/dateUtils.js
const getTodayDateString = () => {
  const now = new Date();
  return now.toISOString().slice(0, 10); // "YYYY-MM-DD"
};export default getTodayDateString
