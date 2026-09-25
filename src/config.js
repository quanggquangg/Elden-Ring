'use strict';
// Vòng Vàng Vỡ — Cấu hình bảng xếp hạng chung (Firebase Firestore)
// Dán apiKey và projectId từ Firebase console: Project settings → General → Your apps → SDK setup and configuration → Config.
// Khóa web của Firebase được thiết kế để nằm công khai trong trang; quyền đọc/ghi do luật trong docs/firestore.rules quyết định.
// Để trống thì bảng xếp hạng chỉ lưu trên trình duyệt của từng người.
const BOARD_CONFIG = {
  apiKey: 'AIzaSyDolqelpXnwckF43ew5m5ACjSQJqLeZbJs',
  projectId: 'elden-ring-2d---claude',
};
